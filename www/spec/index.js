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
describe('app', function() {
    describe('initialize', function() {
        it('should bind deviceready', function() {
            runs(function() {
                spyOn(app, 'onDeviceReady');
                app.initialize();
                helper.trigger(window.document, 'deviceready');
            });

            waitsFor(function() {
                return (app.onDeviceReady.calls.length > 0);
            }, 'onDeviceReady should be called once', 500);

            runs(function() {
                expect(app.onDeviceReady).toHaveBeenCalled();
            });
        });
    });

    describe('onDeviceReady', function() {
        it('should report that it fired', function() {
            spyOn(app, 'receivedEvent');
            app.onDeviceReady();
            expect(app.receivedEvent).toHaveBeenCalledWith('deviceready');
        });
    });

    describe('receivedEvent', function() {
        beforeEach(function() {
            var el = document.getElementById('stage');
            el.innerHTML = ['<div id="deviceready">',
                            '    <p class="event listening">Listening</p>',
                            '    <p class="event received">Received</p>',
                            '</div>'].join('\n');
        });

        it('should hide the listening element', function() {
            app.receivedEvent('deviceready');
            var displayStyle = helper.getComputedStyle('#deviceready .listening', 'display');
            expect(displayStyle).toEqual('none');
        });

        it('should show the received element', function() {
            app.receivedEvent('deviceready');
            var displayStyle = helper.getComputedStyle('#deviceready .received', 'display');
            expect(displayStyle).toEqual('block');
        });
    });
});
describe('Timepiece', function() {
    beforeEach(function() {
        this.addMatchers({
            toBeBetween: function(lowerBound, upperBound) {
                return lowerBound <= this.actual && this.actual <= upperBound;
            }
        });
    });
    describe('calculations', function() {
        it('should not be running on construction', function() {
            var t = new Timepiece();
            expect(t.isRunning()).toBeFalsy();
        });
        it('should have zero time on construction', function() {
            var t = new Timepiece();
            expect(t.getTotalTime()).toEqual(0);
        });
        it('should have zero time shortly after construction', function() {
            var t;
            var waited = false;
            runs(function() {
                t = new Timepiece();
                window.setTimeout(function() {
                    waited = true;
                }, 1100);
            });
            waitsFor(function() { return waited; }, 2000);
            runs(function() {
                expect(t.getTotalTime()).toEqual(0);
            });
        });
        it('should be running after having been started', function() {
            var t = new Timepiece();
            t.start();
            expect(t.isRunning()).toBeTruthy();
        });
        it('double start should not change anything', function() {
            var t = new Timepiece();
            expect(t.isRunning()).toBeFalsy();
            t.start();
            expect(t.isRunning()).toBeTruthy();
            t.start();
            expect(t.isRunning()).toBeTruthy();
        });
        it('multiple starts and stops without waiting', function() {
            var t = new Timepiece();
            expect(t.isRunning()).toBeFalsy();
            t.start();
            expect(t.isRunning()).toBeTruthy();
            t.start();
            expect(t.isRunning()).toBeTruthy();
            t.stop();
            expect(t.isRunning()).toBeFalsy();
            t.stop();
            expect(t.isRunning()).toBeFalsy();
            expect(t.getTotalTime()).toBeBetween(0, 100);
        });
        it('should have zero time just after having been started', function() {
            var t = new Timepiece();
            t.start();
            expect(t.isRunning()).toBeTruthy();
            expect(t.getTotalTime()).toBeBetween(0, 100);
        });
        it('should have one second, one second after having been started', function() {
            var t;
            var waited = false;
            runs(function() {
                t = new Timepiece();
                t.start();
                window.setTimeout(function() {
                    waited = true;
                }, 950);
            });
            waitsFor(function() { return waited; }, 2000);
            runs(function() {
                expect(t.isRunning()).toBeTruthy();
                expect(t.getTotalTime()).toBeBetween(950, 1100);
            });
        });
        it('multiple starts and stops should return correct number of timestamps', function() {
            var t = new Timepiece();
            expect(t.getTimestamps().length).toEqual(0);
            t.start();
            expect(t.getTimestamps().length).toEqual(1);
            t.start();
            expect(t.getTimestamps().length).toEqual(1);
            t.stop();
            expect(t.getTimestamps().length).toEqual(2);
            t.stop();
            expect(t.getTimestamps().length).toEqual(2);
        });
        it('should return a copy of the timestamp array', function() {
            var t = new Timepiece();
            t.start();
            t.stop();
            var timestamps = t.getTimestamps();
            expect(timestamps.length).toEqual(2);
            t.start();
            expect(timestamps.length).toEqual(2);
            expect(t.getTimestamps().length).toEqual(3);
        });
        it('should return the correct total time after one second running, one second pause and one second running', function() {
            var t;
            var waited = false;
            runs(function() {
                t = new Timepiece();
                t.start();
                window.setTimeout(function() {
                    waited = true;
                }, 950);
            });
            waitsFor(function() { return waited; }, 2000);
            runs(function() {
                waited = false;
                t.stop();
                window.setTimeout(function() {
                    waited = true;
                }, 950);
            });
            waitsFor(function() { return waited; }, 2000);
            runs(function() {
                waited = false;
                t.start();
                window.setTimeout(function() {
                    waited = true;
                }, 950);
            });
            waitsFor(function() { return waited; }, 2000);
            runs(function() {
                expect(t.isRunning()).toBeTruthy();
                t.stop();
                expect(t.isRunning()).toBeFalsy();
                expect(t.getTotalTime()).toBeBetween(1900, 2100);
            });
        });
    });
    describe('persistence', function() {
    });
});
