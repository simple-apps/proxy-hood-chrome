/*jslint browser: true*/
/*global  $, chrome*/
$(document).ready(function () {
    "use strict";
    //init
    $("[name='power']").bootstrapSwitch();
    chrome.extension.getBackgroundPage().isProxy(function (bool) {
        if (bool === true) {
            chrome.browserAction.setIcon({path: 'icons/19_on.png'});
            $("[name='power']").bootstrapSwitch('state', true);
        } else {
            chrome.browserAction.setIcon({
                path: 'icons/19.png'
            });
            $("[name='power']").bootstrapSwitch('state', false);
        }
    });
    chrome.extension.getBackgroundPage().prepareToUpdate(function (list) {
        if (!$.isEmptyObject(list)) {
            $('#updated').text('Right now!');
        } else {
            chrome.extension.getBackgroundPage().getLastUpdated(function (time) {
                $('#updated').text(time.time_updated);
            });
        }
        populateProxies();
    });
    var getCustomProxies = function (fn) {
        var saved = [], data_dup;
        chrome.storage.local.get(function (data) {

            var i, n = 0;
            for (i in data) {
                if (data.hasOwnProperty(i)) {
                    n += 1;
                    if (data.hasOwnProperty(i)) {
                        if (i.indexOf('customProxies') == 0) {
                            data_dup = $.parseJSON(data[i]);
                            saved[n] = {
                                id: i,
                                protocol: data_dup.protocol,
                                host: data_dup.host,
                                time: data_dup.time
                            };
                        }
                    }
                }
            }
            function compare(a, b) {
                if (a.time > b.time) {
                    return -1;
                }
                if (a.time < b.time) {
                    return 1;
                }
                return 0;
            }
            saved.sort(compare);
            fn(saved);
        });
    }, updateCustomProxyList = function () { // fill in form
        getCustomProxies(function (storage) {
            $('#customProxies').text('');
            var i;
            for (i in storage) {
                if (storage.hasOwnProperty(i)) {
                    $('<option value="' + storage[i].id + '" data-protocol="' + storage[i].protocol + '" data-host="' + storage[i].host + '" />', {
                    }).text(storage[i].protocol + '://' + storage[i].host).appendTo($('#customProxies'));
                }
            }
        });
    }, populateProxies = function () {
        chrome.storage.local.get('proxyList', function (list) {
            var i;
            if (!$.isEmptyObject(list)) {
                $('#list').text('');
                for (i = 0; i < list.proxyList.length; i += 1) {
                    $('<option value="' + list.proxyList[i] + '" data-protocol="http" data-host="' + list.proxyList[i] + '" />', {
                    }).text(list.proxyList[i]).appendTo($('#list'));
                }
            }
        });
    }, checkUpdates = function () {
        $.getJSON('http://api.proxyhood.com:81/version.json', function(data){
            if (data.version !== chrome.app.getDetails().version) {
                $('#home').attr('data-href', data.src);
                $('#home').text('Update to ' + data.version + ' now');
            }
        });
    };
    updateCustomProxyList();
    checkUpdates();
    //switch
    $("[name='power']").on('switchChange', function (e, data) {
        if (e === undefined) {
            return false;
        }
        if (data.value === true) {
            var type = $('.tab-pane.active').attr('id'),
                host = $('#customProxies').find(":selected").attr('data-host'),
                protocol = $('#customProxies').find(":selected").attr('data-protocol');
            if (type === 'manual') {
                chrome.extension.getBackgroundPage().runProxy(protocol, host, function () {
                    chrome.notifications.create('switch_on', {
                        type: "basic",
                        title: "Proxy Hood is On",
                        message: "Automatic proxy has been activated.",
                        iconUrl: 'icons/128_on.png'
                    }, function(){});
                });
            } else {
                host = $('#list').find(":selected").attr('data-host');
                protocol = 'http';
                chrome.extension.getBackgroundPage().runProxy(protocol, host, function () {
                    chrome.notifications.create('switch_on', {
                        type: "basic",
                        title: "Proxy Hood is On",
                        message: "Automatic proxy has been activated.",
                        iconUrl: 'icons/128_on.png'
                    }, function(){});
                });
            }
            chrome.browserAction.setIcon({path: 'icons/19_on.png'});
        } else {
            chrome.extension.getBackgroundPage().clearProxy(function () {
                chrome.browserAction.setIcon({path: 'icons/19.png'});
                
                chrome.notifications.create('switch_off', {
                    type: "basic",
                    title: "Proxy Hood is Off",
                    message: "You are browsing with your own IP address now.",
                    iconUrl: 'icons/128.png'
                }, function(){});
            });
        }
    });
    //automatic
    $("#updateNow").click(function(){
        chrome.extension.getBackgroundPage().updateProxies(function(list){
            populateProxies();
            chrome.extension.getBackgroundPage().getLastUpdated(function (time) {
                $('#updated').text(time.time_updated);
            });
        });
    });
    //manual
    $("[name='add_custom']").click(function () {
        if ($('#host').val() === '' || $('#protocol').val() === '') {
            return false;
        }
        var obj = {},
            uuid = chrome.extension.getBackgroundPage().guuid('customProxies');
        obj[uuid] = JSON.stringify({
            protocol: $('#protocol').val(),
            host: $('#host').val(),
            time: Date.now()
        });
        chrome.storage.local.set(obj, function () {
            updateCustomProxyList();
        });
        return false;
    });
    $('#clearAll').click(function () {
        chrome.storage.local.clear(function () {
            updateCustomProxyList();
        });
    });
    $('#removeSelected').click(function () {
        var current_id = $('#customProxies').val();
        chrome.storage.local.remove(current_id, function () {
            updateCustomProxyList();
        });
    });
    $('#home').click(function () {
        chrome.tabs.create({'url': $(this).attr('data-href')});
        return false;
    });
    //btc
    $(".btc").html('Donate <strong>15SXejwpA4SpwbmGsYof5daTv9LjwRzsgC</strong>');
});