/// <reference path="~/bower_components/gmaps/gmaps.js" />
/// <reference path="~/bower_components/knockout/dist/knockout.js" />
/// <reference path="~/bower_components/oauth-1.0a/oauth-1.0a.js" />
/// <reference path="~/js/view_models/locations.js" />

(function () {
    app = {};

    app.fourSquareClientId = "0NC5XNANWMJPLWHUZY50XYRDMZVOG1JCO0OBDMGD0FDHSV51";
    app.fourSquareClientSecret = "GKZWSI40LC25ARQA5LI4YS4TB0OWSEPYB4ORB4E1NCVHX3EU";

    app.viewModel = new RestaurantsViewModel("");
    app.restaurantLocations = restaurantLocations;

    // initialize restaurant locations
    for (var i = 0; i < app.restaurantLocations.length; i++) {
        var newRestaurant = new Restaurant(app.restaurantLocations[i].name, app.restaurantLocations[i].location);
        app.viewModel.restaurants()[i] = newRestaurant;
    }

    // sort restaurants by name
    app.viewModel.restaurants = app.viewModel.restaurants.sort(function (a, b) {
        var aa = a.name;
        var bb = b.name;
        return aa < bb ? -1 : (aa > bb ? 1 : 0);
    });

    app.initMap = function () {
        app.gmaps = new GMaps({
            div: '#map',
            lat: 37.6801097,
            lng: -97.30499,
            zoom: 12
        });

        // Refresh the Google Maps markers
        app.refreshMarkers = function (viewModel) {
            // Unset previous locations
            var restaurants = viewModel.restaurants();
            for (var i = 0; i < restaurants.length; i++) {
                var restaurant = restaurants[i];
                restaurant.map.marker.setMap(null);
            }

            // Set current filtered locations
            var filteredRestaurants = viewModel.filteredRestaurants();
            for (var i = 0; i < filteredRestaurants.length; i++) {
                var restaurant = filteredRestaurants[i];
                restaurant.map.marker.setMap(restaurant.map.gmaps.map);
            }
        }

        // Import restaurant names and locations into view models from locations.
        for (var i = 0; i < app.restaurantLocations.length; i++) {
            var newRestaurant = app.viewModel.restaurants()[i];

            var infoWindow = new google.maps.InfoWindow({
                content: '<i class="fa fa-spinner fa-spin fa-1x fa-fw"></i><span>Loading...</span>'
            });

            var marker = app.gmaps.addMarker({
                lat: newRestaurant.location.lat,
                lng: newRestaurant.location.lng,
                title: newRestaurant.name,
                infoWindow: infoWindow,
                restaurant: newRestaurant,
                click: function () {
                    var self = this;
                    self.restaurant.selectRestaurant();
                }
            });

            newRestaurant.map = {
                gmaps: app.gmaps,
                marker: marker,
                infoWindow: infoWindow
            };

            // Use AJAX to get data from FourSquare
            (function (restaurant) {
                $.ajax({
                    url: "https://api.foursquare.com/v2/venues/search",
                    method: "GET",
                    dataType: "json",
                    data: {
                        ll: newRestaurant.location.lat + "," + newRestaurant.location.lng,
                        client_id: app.fourSquareClientId,
                        client_secret: app.fourSquareClientSecret,
                        v: "20150401",
                        query: newRestaurant.name
                    }
                }).done(function (data) {
                    var venue = data.response.venues[0];
                    restaurant.venue = venue;

                    // If a venue is found, write info into the info window
                    if (venue) {
                        var phone = (venue.contact && venue.contact.formattedPhone) ? venue.contact.formattedPhone : "n/a";
                        var address = (venue.location && venue.location.address) ? venue.location.address : "n/a";

                        restaurant.map.infoWindow.setContent(
                            '<strong>' + venue.name + '</strong>' +
                            '<p>Address: ' + address + '</p>' +
                            '<p>Phone number: ' + phone + '</p>');
                    } else {
                        restaurant.map.infoWindow.setContent(
                            '<strong>' + restaurant.name + '</strong>' +
                            '<p>No data found on FourSquare</p>');
                    }
                }).fail(function (data) {
                    // There was a problem connecting to FourSquare's API
                    restaurant.map.infoWindow.setContent(
                        '<p>Sorry, there was a problem getting the data. Please <b>refresh</b> the page or contact the administrator.</p>');
                });
            })(newRestaurant);
        }

        app.refreshMarkers(app.viewModel);
    }

    ko.applyBindings(app.viewModel);
})();