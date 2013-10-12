/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        this.userInterface = new UserInterface();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

function UserInterface() {
    var that = this;
    this.timepieces = [];
    $('#newTimepiece').click(function() {
        that.newTimepiece();
    });
}
UserInterface.prototype.newTimepiece = function() {
    var t = new Timepiece("Unnamed");
    var ui = new TimepieceRenderer(t);
    this.timepieces.unshift(t);
}

function TimepieceRenderer(timepiece) {
    var that = this;
    this.timepiece = timepiece;
    this.container = $('#timepieceTemplate').clone();
    this.container.removeAttr('id');
    this.container.insertAfter($('#firstRow'));
    $('.timepieceName', this.container).click(function() {
        var name = window.prompt('Rename', that.timepiece.getName());
        if (name !== null) {
            that.timepiece.setName(name);
            that._updateName();
        }
    });
    $('.buttonRemove', this.container).click(function() {
        // TODO unregister interval
        // TODO remove from UserInterface
        that.container.slideUp('fast');
        // TODO destroy afterwards
    });
    $('.buttonStartStop', this.container).click(function() {
        that._startStopClicked();
    });
    $('.buttonToggleDetails', this.container).click(function() {
        that._toggleDetailsClicked();
    });
    this.interval = window.setInterval(function() {
        that._updateTime();
    }, 100);
    this.container.hide();
    this.container.slideDown('fast');
    this._updateTime();
    this._updateName();
    this._updateDetailsList();
}
TimepieceRenderer.prototype._startStopClicked = function() {
    this.timepiece.toggle();
    $('.buttonStartStop', this.container).text(
            this.timepiece.isRunning() ? 'Pause' : 'Start');
    this._updateDetailsList();
}
TimepieceRenderer.prototype._updateName = function() {
    $('.timepieceName', this.container).text(this.timepiece.getName());
}
TimepieceRenderer.prototype._updateTime = function() {
    var milliSeconds = this.timepiece.getTotalTime();
    var seconds = milliSeconds / 1000;
    $('.time', this.container)
        .empty()
        .append($('<span/>').text(
              sprintf('%02d:%02d:%02d',
                      Math.floor(seconds / 3600),
                      Math.floor((seconds / 60) % 60),
                      Math.floor(seconds % 60))))
        .append($('<span class="deciseconds"/>').text(
              sprintf('.%d', Math.floor((milliSeconds / 100) % 10))));
}
TimepieceRenderer.prototype._updateDetailsList = function() {
    function formatTime(timestamp) {
        var d = new Date(timestamp);
        return sprintf("%02d:%02d:%02d",
                       d.getHours(), d.getMinutes(), d.getSeconds());
    }
    var tbody = $('.detailsTable tbody', this.container);
    $('tr', tbody).remove();
    var timestamps = this.timepiece.getTimestamps();
    for (var i = 0; i < timestamps.length; i += 2) {
        var row = $('<tr>')
            .append($('<td>').text(formatTime(timestamps[i])));
        if (i + 1 < timestamps.length) {
            row.append($('<td>').text(formatTime(timestamps[i + 1])));
        } else {
            row.append($('<td/>'));
        }
        row.appendTo(tbody);
    }
}
TimepieceRenderer.prototype._toggleDetailsClicked = function() {
    $('.detailsRow', this.container).slideToggle('fast');
}

/**
 * Class to register time. Can be started, stoppend and re-started arbitrarily.
 * It is possible to query the timestamps of starts and stops and retrieve the
 * overall time.
 */
function Timepiece(name) {
    this.name = name;
    this.timestamps = [];
}
/**
 * Returns the name of this timepiece.
 */
Timepiece.prototype.getName = function() {
    return this.name
}
/**
 * Sets the name of this timepiece.
 */
Timepiece.prototype.setName = function(name) {
    this.name = name;
}
/**
 * Returns the current time in milliseconds since the epoch.
 */
Timepiece.prototype._getCurrentTimeMillis = function() {
    return (new Date()).getTime();
}
/**
 * Returns the summed amount of time in milliseconds.
 */
Timepiece.prototype.getTotalTime = function() {
    var sum = 0;
    for (var i = 0; i + 1 < this.timestamps.length; i += 2) {
        sum += this.timestamps[i + 1] - this.timestamps[i];
    }
    if (this.isRunning()) {
        sum += this._getCurrentTimeMillis() - this.timestamps[this.timestamps.length - 1];
    }
    return sum;
}
/**
 * Returns true iff the timepiece is running/started.
 */
Timepiece.prototype.isRunning = function() {
    return this.timestamps.length % 2 == 1;
}
/**
 * (Re-)starts the timepiece.
 */
Timepiece.prototype.start = function() {
    if (this.isRunning())
        return;
    this.toggle();
}
/**
 * Stops the timepiece if it is not already stopped.
 */
Timepiece.prototype.stop = function() {
    if (!this.isRunning())
        return;
    this.toggle();
}
Timepiece.prototype.toggle = function() {
    this.timestamps.push(this._getCurrentTimeMillis());
}
/**
 * Returns a list of all timestamps recorded.
 */
Timepiece.prototype.getTimestamps = function() {
    return this.timestamps.slice();
}
