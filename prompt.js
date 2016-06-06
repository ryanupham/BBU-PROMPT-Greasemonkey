// ==UserScript==
// @name         BBU PROMPT
// @version      0.1
// @description  Augment BBU PROMPT ordering application
// @author       Ryan Upham
// @include      *://sales.bbuconnect.com/prompt/,DanaInfo=*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var days = ["mon", "tue", "thu", "fri", "sat"];

    window.findItem = function(id) {
        var items = $("a[title='report card']");

        for(var i = 0; i < items.length; i++)
            if(getItemID(items[i]) == id)
                return $(items[i]);

        return null;
    };

    window.getItemDay = function(id, day) {
        var item = findItem(id);

        if(item == null)
            return null;

        return item.parent().parent().find("input[name=" + day + "]");
    };

    window.getItemDayQuantity = function(id, day) {
        var day = getItemDay(id, day);

        if(day == null)
            return 0;

        if(day.val() == "-")
            return 0;

        return +day.val();
    };

    window.editDay = function(id, day, val) {
        var day = getItemDay(id, day);

        if(day != null) {
            day.focus();
            day.val(val);
            day.change();
            day.blur();
        }
    };

    window.getWeekTotal = function(id) {
        var total = 0;

        for(var i = 0; i < days.length; i++) {
            var day = getItemDay(id, days[i]);

            if(day != null)
                if(day.val() != "-")
                    total += +day.val();
        }

        return total;
    };

    window.canEditDay = function(day) {
        if(day == null)
            return false;

        return day.val() != "-" && day.attr("type") != "HIDDEN";
    };

    window.editWeek = function(id, total) {
        var oldTotal = getWeekTotal(id);
        var curTotal = 0;

        for(var i = 0; i < days.length - 1; i++) {
            var day = getItemDay(id, days[i]);

            if(day != null)
                if(day.attr("type") == "HIDDEN" && day.val() != "-")
                    total -= +day.val();
        }

        for(var i = 0; i < days.length - 1; i++) {
            var day = getItemDay(id, days[i]);

            if(canEditDay(day)) {
                day.val(Math.round(+day.val() * total / oldTotal));
                curTotal += +day.val();
            }
        }

        for(var i = days.length - 1; i >= 0; i--) {
            var day = getItemDay(id, days[i]);

            if(canEditDay(day)) {
                day.val(+day.val() + (total - curTotal));
                break;
            }
        }
    };

    window.getItemID = function(item) {
        return $(item).get(0).text.split(" ")[0].trim();
    };

    window.MThSOrder = function(item) {
        var item = $(item).parent().find("a[title='report card']")[0];
        var id = getItemID(item);

        if(canEditDay(getItemDay(id, "mon")) && canEditDay(getItemDay(id, "tue"))) {
            editDay(id, "mon", getItemDayQuantity(id, "mon") + getItemDayQuantity(id, "tue"));
            editDay(id, "tue", 0);
        }

        if(canEditDay(getItemDay(id, "thu"))) {
            editDay(id, "thu", getItemDayQuantity(id, "thu") + getItemDayQuantity(id, "fri"));
            editDay(id, "fri", 0);
        }
    };

    function addButtons() {
        var items = $("a[title='report card']");

        for(var i = 0; i < items.length; i++) {
            var item = $(items[i]).parent();
            item.append("<button type=\"button\" onClick=\"MThSOrder(this);\">MThS</button>");
        }
    }

    function selectOnClick() {
        var items = $("input[onfocus=\"holdOldValue(this.value)\"],[name=\"row_total\"]");

        items.each(function(ind, val) {
            $(val).click(function() { $(this).select(); });
        });
    }

    addButtons();
    selectOnClick();

})();
