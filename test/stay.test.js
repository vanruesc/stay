describe("Stay", function() {

	describe("Basics", function() {

		var stay;

		it("is a constructor function", function() {

			assert(typeof Stay === "function");

		});

		it("should be instancable", function() {

			stay = new Stay();

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

			stay = new Stay();

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

});
