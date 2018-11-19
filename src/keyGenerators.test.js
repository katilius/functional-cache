const {
  pickFirstArgument,
  pickNthArgument,
  pickFirstArgumentField
} = require("./keyGenerators");

describe("keyGenerators", () => {
  describe("#pickFirstArgument", () => {
    it("returns first argument from all arguments", () => {
      expect(pickFirstArgument(1, 2, 3)).toEqual(1);
    });

    it("returns undefined, when no args provided", () => {
      expect(pickFirstArgument()).toBeUndefined();
    });
  });

  describe("#pickNthArgument", () => {
    it("returns a function", () => {
      expect(typeof pickNthArgument(2)).toBe("function");
    });

    it("returns arguments provided by index", () => {
      expect(pickNthArgument(2)("A", "B", "C")).toEqual("C");
    });

    it("returns undefined when less arguments provided", () => {
      expect(pickNthArgument(2)("A")).toBeUndefined();
    });
  });

  describe("pickFirstArgumentField", () => {
    it("returns a function", () => {
      expect(typeof pickFirstArgumentField("a")).toBe("function");
    });

    it("takes first argument and takes provided fields from object", () => {
      expect(pickFirstArgumentField("name")({ name: "Rick" })).toEqual("Rick");
    });

    it("returns undefined, when no arguments provided", () => {
      expect(pickFirstArgumentField("name")()).toBeUndefined();
    });
  });
});
