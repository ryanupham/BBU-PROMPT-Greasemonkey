// ==UserScript==
// @name         BBU PROMPT
// @version      0.1
// @description  Augment BBU PROMPT ordering application
// @author       Ryan Upham
// @include      *://sales.bbuconnect.com/prompt/,DanaInfo=*
// @include      http://blank.org/
// @include      http://www.blankwebsite.com/
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    /* SETTINGS */

    function buildPage() {
        document.documentElement.innerHTML = "";

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.onload = function() {
            document.head.innerHTML += '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">';
            document.head.innerHTML += '<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>';

            var container = document.createElement("div");
            container.className = "container-fluid";
            container.style = "margin-top: 15px;";

            var well = document.createElement("div");
            well.className = "well col-lg-7";

            var inlineForm = document.createElement("div");
            inlineForm.className = "form-inline";
            well.appendChild(inlineForm);

            var days = ["M", "T", "Th", "F", "S"];

            for(var i = 0; i < 5; i++) {
                var inGroup = document.createElement("div");
                inGroup.className = "input-group";

                var dayLabel = document.createElement("span");
                dayLabel.className = "input-group-addon";
                dayLabel.innerHTML = days[i];
                inGroup.appendChild(dayLabel);

                var dayInput = document.createElement("input");
                dayInput.type = "text";
                dayInput.className = "form-control";
                inlineForm.innerHTML += " ";
                inGroup.appendChild(dayInput);

                inGroup.style = "width: calc(20% - 4px);";
                inlineForm.appendChild(inGroup);
            }

            well.appendChild(document.createElement("br"));

            var textbox = document.createElement("textarea");
            textbox.className = "form-control";
            textbox.rows = "20";
            well.appendChild(textbox);

            container.appendChild(well);
            document.body.appendChild(container);

            $(well).hide();

            var saveButtonContainer = document.createElement("div");
            saveButtonContainer.className = "container-fluid";

            var saveButton = document.createElement("button");
            saveButton.type = "button";
            saveButton.className = "btn btn-primary";
            saveButton.innerHTML = "Save";
            $(saveButton).click(save);
            saveButtonContainer.appendChild(saveButton);
            document.body.appendChild(saveButtonContainer);
        };

        script.src = "http://code.jquery.com/jquery-latest.min.js";
        document.head.appendChild(script);
    }

    unsafeWindow.addForm = function() {
        $($(".well")[0]).clone().appendTo(".container-fluid:first");
        $(".well:last").show();
    };

    unsafeWindow.formCount = function() {
        return $(".well").length - 1;
    };

    unsafeWindow.updateForms = function() {
        if(formCount() == 0)
            addForm();

        $(".well").each(function(ind, val) {
            if(ind > 0 && ind < formCount()) {
                var rem = true;

                $(val).find("input").each(function(ind, val) {
                    if($(val).val() != "")
                        rem = false;
                });

                if($(val).find("textarea:first").val() != "")
                    rem = false;

                if(rem)
                    $(val).remove();
            }
        });

        var add = false;

        $(".well:last").find("input").each(function(ind, val) {
            if($(val).val() != "")
                add = true;
        });

        if($(".well:last").find("textarea").val() != "")
            add = true;

        if(add)
            addForm();
    };

    function getValues() {
        var vals = [];

        for(var i = 1; GM_getValue(i, []).length != 0; i++)
            vals.push(GM_getValue(i));

        return vals;
    }

    function clearValues() {
        for(var i = 1; GM_getValue(i, []).length != 0; i++)
            GM_setValue(i, []);
    }

    function save() {
        clearValues();

        $(".well").each(function(indGroup, val) {
            if(indGroup > 0 && indGroup < formCount()) {
                var vals = [];

                $(val).find("input").each(function(ind, val) {
                    var num = parseInt($(val).val());

                    if(isNaN(num) || num < 0)
                        num = 0;

                    vals.push(num);
                });

                vals.push($(val).find("textarea").val().split("\n"));

                GM_setValue(indGroup, vals);
            }
        });

        getDict();
    }

    function getDict() {
        var dict = {};
        var vals = getValues();

        for(var i = 0; i < vals.length; i++)
            for(var j = 0; j < vals[i][5].length; j++)
                dict[vals[i][5][j]] = vals[i];

        return dict;
    }

    /* PROMPT */

    var days = ["mon", "tue", "thu", "fri", "sat"];

    unsafeWindow.findItem = function(id) {
        var items = $("a[title='report card']");

        for(var i = 0; i < items.length; i++)
            if(getItemID(items[i]) == id)
                return $(items[i]);

        return null;
    };

    unsafeWindow.getItemDay = function(id, day) {
        var item = findItem(id);

        if(item == null)
            return null;

        return item.parent().parent().find("input[name=" + day + "]");
    };

    unsafeWindow.getItemDayQuantity = function(id, day) {
        var day = getItemDay(id, day);

        if(day == null)
            return 0;

        if(day.val() == "-")
            return 0;

        return +day.val();
    };

    unsafeWindow.editDay = function(id, day, val) {
        day = getItemDay(id, day);

        if(day != null) {
            day.focus();
            day.val(val);
            day.change();
            day.blur();
        }
    };

    unsafeWindow.getWeekTotal = function(id) {
        var total = 0;

        for(var i = 0; i < days.length; i++) {
            var day = getItemDay(id, days[i]);

            if(day != null)
                if(day.val() != "-")
                    total += +day.val();
        }

        return total;
    };

    unsafeWindow.canEditDay = function(day) {
        if(day == null)
            return false;

        return day.val() != "-" && day.attr("type") != "HIDDEN";
    };

    unsafeWindow.editWeek = function(id, total) {
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

    unsafeWindow.getItemID = function(item) {
        return $(item).get(0).text.split(" ")[0].trim();
    };

    unsafeWindow.MThSOrder = function(item) {
        item = $(item).parent().find("a[title='report card']")[0];
        var id = getItemID(item);
        console.log(dict);

        /*if(canEditDay(getItemDay(id, "mon")) && canEditDay(getItemDay(id, "tue"))) {
            editDay(id, "mon", getItemDayQuantity(id, "mon") + getItemDayQuantity(id, "tue"));
            editDay(id, "tue", 0);
        }

        if(canEditDay(getItemDay(id, "thu"))) {
            editDay(id, "thu", getItemDayQuantity(id, "thu") + getItemDayQuantity(id, "fri"));
            editDay(id, "fri", 0);
        }*/
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

    if(window.location.href.includes("blank.org")) {
        buildPage();
        setInterval(updateForms, 250);
    } else {
        unsafeWindow.dict = getDict();
        addButtons();
        selectOnClick();
    }
})();