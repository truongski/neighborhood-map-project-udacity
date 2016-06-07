/// <reference path="~/bower_components/knockout/dist/knockout.js" />
/// <reference path="~/js/main.js" />
/// <reference path="~/js/locations.js" />

function Restaurant(name, location) {
    var self = this;
    self.name = ko.observable(name);

    // dict of { lat, lng }
    self.location = location;

    // called when a marker or the list item is selected
    self.selectRestaurant = function () {
        // reset all open info windows
        for (var i = 0; i < app.viewModel.restaurants().length; i++) {
            app.viewModel.restaurants()[i].map.infoWindow.close();
        }

        var map = self.map;

        // Open the info window and save for closing
        map.infoWindow.open(map.gmaps.map, map.marker);

        // Bounce the marker once
        if (map.marker.getAnimation() == null) {
            map.marker.setAnimation(google.maps.Animation.BOUNCE);

            // Stop animation when it bounces once
            setTimeout(function () {
                map.marker.setAnimation(null);
            }, 750);
        }
    };
}

function RestaurantsViewModel(filterText) {
    var self = this;

    // restaurant filter text box
    self.filterText = ko.observable(filterText);

    // internal list of restaurants
    self.restaurants = ko.observableArray([]);

    // filtered list of restaurants, the list that is shown on the sidebar and the map
    self.filteredRestaurants = ko.computed(function () {
        var filterText = self.filterText().toLowerCase();

        var filtered = ko.utils.arrayFilter(self.restaurants(), function (restaurant) {
            if (filterText === "")
                return true;

            // Check all words in the name for a match
            var tokens = restaurant.name().toLowerCase().split(" ");
            for (var i = 0; i < tokens.length; i++) {
                if (tokens[i].startsWith(filterText))
                    return true;
            }

            return false;
        });

        // show "No matches found" if there are no locations matching the filter
        if (filtered.length == 0) {
            filtered.push(new Restaurant("No matches found."));
        }
        return filtered;
    }, self);

    self.filterRestaurants = function () {
        app.refreshMarkers(self);
    }

    // pressing "Enter" will filter the restaurants
    self.onKeyPressFilterText = function (data, event) {
        if (event.keyCode === 13) {
            self.filterRestaurants();
        }
    }
}