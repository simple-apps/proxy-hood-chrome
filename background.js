/*jslint browser: true*/
/*global  $, chrome, moment*/

"use strict";
var isItAfterTwelve = function () {
    if (moment.utc().add('hours', 4).format('H') > 12) {
        return true;
    }
    return false;
}, getCurrentTime = function () {
    return moment.utc().add('hours', 4).format('DD.MM.YYYY HH:mm');
}, saveCurrentTime = function (fn) {
    chrome.storage.local.set({
        time_updated: getCurrentTime()
    }, function () {
        fn();
    });
}, getLastUpdated = function (fn) {
    chrome.storage.local.get('time_updated', function (updated) {
        fn(updated);
    });
}, updateProxies = function (fn) {
    $.getJSON('http://api.proxyhood.com:81/reliable.json', function (list) {
        chrome.storage.local.remove('proxyList');
        chrome.storage.local.set({
            proxyList: list
        }, function () {
            saveCurrentTime(function () {
                fn(list);
            });
        });
    });
}, prepareToUpdate = function (fn) {
    getLastUpdated(function (time) {
        var dayUpdated = moment(time['time_updated'], 'DD.MM.YYYY').format('D'),
            dayNow = moment.utc().add('hours', 4).format('D');
        if ($.isEmptyObject(time.time_updated) || ((dayNow > dayUpdated) && isItAfterTwelve() === true)) {
            updateProxies(fn);
        } else {
            fn(null);
        }
    });
}, guuid = function (pre) {
    var d = new Date().getTime(),
        uuid = pre + '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
    return uuid;
}, getInfo = function (fn) {
    chrome.proxy.settings.get({},
        function (config) {
            fn(config);
        });
}, isProxy = function (fn) {
    getInfo(function (config) {
        fn(config.value.mode === 'fixed_servers');
    });
}, clearProxy = function (fn) {
    chrome.proxy.settings.set({
        value: {
            mode: "direct"
        },
        scope: 'regular'
    },
        function () {
            fn();
        });
}, runProxy = function (protocol, host, fn) {
    var scheme = protocol.toLowerCase(),
        proxy_config = {
            mode: "fixed_servers",
            rules: {
                singleProxy: {
                    scheme: scheme,
                    host: host.split(":")[0],
                    port: parseInt(host.split(":")[1], 10)
                },
                bypassList: []
            }
        };
    if (scheme === 'https') {
        scheme = 'http';
    }
    chrome.proxy.settings.set({
        value: proxy_config,
        scope: 'regular'
    },
        function () {
            fn();
        });
};