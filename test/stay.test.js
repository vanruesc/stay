describe("STAY", function() {

	describe("Sanity checks", function() {

		var stay;

		it("is a constructor function", function() {

			assert(typeof STAY === "function");

		});

		it("should be instancable", function() {

			stay = new STAY();

		});

		it("has an unbindListeners method", function() {

			assert(typeof stay.unbindListeners === "function");

		});

		it("can be destroyed", function() {

			stay.unbindListeners();
			stay = null;

		});

	});

	describe("Navigation", function() {

		var stay;

		before(function() {

			stay = new STAY();

		});

		it("should automatically bind a listener", function() {

			assert(stay.navigationListeners.length > 0);

		});

		it("should ignore excluded URIs", function() {

			stay.exclusions.push(/\//);
			stay._updateListeners();
			assert(stay.navigationListeners.length === 0);

		});

		it("should fire a navigate event", function(done) {

			stay.addEventListener("navigate", function handleNavigate() {

				stay.removeEventListener("navigate", handleNavigate);
				done();

			});

			stay._navigate({href: "./mock.json"});

		});

		it("should fire a receive event", function(done) {

			stay.addEventListener("receive", function handleReceive() {

				stay.removeEventListener("receive", handleReceive);
				done();

			});

			stay._navigate({href: "./mock.json"});

		});

		it("should fire a load event", function(done) {

			stay.addEventListener("load", function handleLoad() {

				stay.removeEventListener("load", handleLoad);
				done();

			});

			stay._navigate({href: "./mock.json"});

		});

		after(function() {

			stay.unbindListeners();
			stay = null;

		});

	});

	describe("History", function() {

		var stay;

		before(function() {

			stay = new STAY();

		});

		it("pushes history states", function(done) {

			var previousState = stay.historyState;

			stay.addEventListener("load", function handleLoad() {

				stay.removeEventListener("load", handleLoad);
				assert(previousState !== stay.historyState, "the history state hasn't been updated");
				done();

			});

			stay._navigate({href: "./mock.json"});

		});

		it("doesn't push the same state consecutively", function(done) {

			var phase = 1;

			// Artificially reset the current state.
			stay.historyState = null;

			stay.addEventListener("load", function handleLoad() {

				if(phase++ === 1) {

					assert(stay.historyState.changed === true, "state should change for the first navigation");
					stay._navigate({href: "./mock.json"});

				} else {

					stay.removeEventListener("load", handleLoad);
					assert(stay.historyState.changed === false, "state shouldn't change for the second navigation");
					done();

				}

			});

			stay._navigate({href: "./mock.json"});

		});

		after(function() {

			stay.unbindListeners();
			stay = null;

		});

	});

});
