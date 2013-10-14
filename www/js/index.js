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
        app.userInterface = new UserInterface();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        $('body').on('pagebeforeshow', function() {
            app.userInterface.restoreData();
        });
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
UserInterface.prototype.restoreData = function() {
    for (var i = 0; i < window.localStorage.length; i ++) {
        var t = Timepiece.CreateFromLocalStorage(i);
        if (t) {
            var ui = new TimepieceRenderer(t);
            this.timepieces.unshift(t);
        }
    }
}
UserInterface.prototype.newTimepiece = function() {
    var id = 1 + (parseInt(window.localStorage.getItem('lastUsedID')) || 0);
    window.localStorage.setItem('lastUsedID', id);
    var t = new Timepiece(id, "Unnamed");
    var ui = new TimepieceRenderer(t);
    this.timepieces.unshift(t);
}

function TimepieceRenderer(timepiece) {
    var that = this;
    this.timepiece = timepiece;
    this.container = $('#timepieceTemplate').clone();
    this.container.removeAttr('id');
    $('#timepiecesContainer')
        .append(this.container);
    this.container.trigger('create');
    $('#timepiecesContainer').listview('refresh');
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
        that.timepiece.destroy();
    });
    $('.buttonReset', this.container).click(function() {
        that.timepiece.reset();
        that._updateTime();
        that._updateDetailsList();
        that._updateStartStopButton();
    });
    $('.buttonStartStop', this.container).click(function() {
        that.timepiece.toggle();
        that._updateStartStopButton();
        that._updateDetailsList();
    });
    $('.buttonToggleDetails', this.container).click(function() {
        $('.detailsRow', that.container).slideToggle('fast');
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
TimepieceRenderer.prototype._updateStartStopButton = function() {
    $('.buttonStartStop', this.container)
        .text(this.timepiece.isRunning() ? 'Pause' : 'Start')
        .button('refresh');
}
TimepieceRenderer.prototype._updateName = function() {
    $('.timepieceName', this.container).text(this.timepiece.getName());
}
TimepieceRenderer.prototype._updateTime = function() {
    var seconds = Math.floor(this.timepiece.getTotalTime() / 1000);
    if (!this.lastSeconds || seconds != this.lastSeconds) {
        $('.time', this.container)
            .empty()
            .append($('<span/>').text(
                  sprintf('%02d:%02d:%02d',
                          Math.floor(seconds / 3600),
                          Math.floor((seconds / 60) % 60),
                          Math.floor(seconds % 60))));
        this.lastSeconds = seconds;
    }
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

/**
 * Class to register time. Can be started, stoppend and re-started arbitrarily.
 * It is possible to query the timestamps of starts and stops and retrieve the
 * overall time.
 */
function Timepiece(id, name, _timestamps, _doNotSave) {
    this.id = id;
    this.name = name;
    this.timestamps = _timestamps || [];
    if (!_doNotSave)
        this._saveToStorage();
}
/**
 * Save the current object to local storage.
 */
Timepiece.prototype._saveToStorage = function() {
    window.localStorage.setItem(
            'timepiece_' + this.id,
                JSON.stringify({name: this.name,
                                timestamps: this.timestamps}));
}
/**
 * Factory function, create a Timepiece object from local storage.
 */
Timepiece.CreateFromLocalStorage = function(keyIndex) {
    var key = window.localStorage.key(keyIndex);
    if (!key.match(/^timepiece_[0-9]+$/))
        return null;
    var id = parseInt(key.substr(10));
    var value = window.localStorage.getItem(key);
    var data = JSON.parse(value);
    return new Timepiece(id, data.name, data.timestamps, true);
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
    this._saveToStorage();
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
    this._saveToStorage();
}
Timepiece.prototype.reset = function() {
    this.timestamps = [];
    this._saveToStorage();
}
/**
 * Returns a list of all timestamps recorded.
 */
Timepiece.prototype.getTimestamps = function() {
    return this.timestamps.slice();
}
/**
 * Removes this timepiece from the local storage.
 */
Timepiece.prototype.destroy = function() {
    window.localStorage.removeItem('timepiece_' + this.id);
}
