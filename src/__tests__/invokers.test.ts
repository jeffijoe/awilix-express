import { makeClassInvoker, makeFunctionInvoker, inject } from "../invokers";
import { createContainer, AwilixContainer, asValue, asFunction } from "awilix";
import * as Express from "express";

describe("invokers", function() {
  let container: AwilixContainer;
  let methodSpy: any;
  let factorySpy: any;
  let constructorSpy: any;
  let request: any;
  beforeEach(function() {
    factorySpy = jest.fn();
    constructorSpy = jest.fn();
    methodSpy = jest.fn();
    container = createContainer();
    container.register("param", asValue(42));
    request = { container };
  });

  describe("makeFunctionInvoker", function() {
    it("returns callable middleware", function() {
      function target({ param }: any) {
        factorySpy();
        const obj = {
          method(req: any, res: Express.Response) {
            methodSpy();
            expect(this).toBe(obj);
            return [req, param];
          }
        };
        return obj;
      }

      const invoker = makeFunctionInvoker(target);

      // Call it twice.
      invoker("method")(request);
      const result = invoker("method")(request);

      expect(result).toEqual([request, 42]);
      expect(factorySpy).toHaveBeenCalledTimes(2);
      expect(methodSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("makeClassInvoker", function() {
    it("returns callable middleware", function() {
      class Target {
        param: any;
        constructor({ param }: any) {
          constructorSpy();
          this.param = param;
        }

        method(req: any, additional: any) {
          methodSpy();
          expect(this).toBeInstanceOf(Target);
          return [req, this.param, additional];
        }
      }

      const invoker = makeClassInvoker(Target);

      // Call it twice.
      invoker("method")(request, "hello");
      const result = invoker("method")(request, "hello");

      expect(result).toEqual([request, 42, "hello"]);
      expect(constructorSpy).toHaveBeenCalledTimes(2);
      expect(methodSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("inject", () => {
    describe("passing a function", () => {
      it("converts function to resolver returns callable middleware", () => {
        const converted = inject(({ param }: any) => {
          constructorSpy();
          return (req: any, additional: any) => {
            methodSpy();
            return [req, param, additional];
          };
        });

        // Call it twice.
        converted(request, "hello");
        const result = converted(request, "hello");

        expect(result).toEqual([request, 42, "hello"]);
        expect(constructorSpy).toHaveBeenCalledTimes(2);
        expect(methodSpy).toHaveBeenCalledTimes(2);
      });
    });

    describe("passing a resolver", () => {
      it("converts function to resolver returns callable middleware", () => {
        const converted = inject(
          asFunction(({ param }: any) => {
            constructorSpy();
            return (req: any, additional: any) => {
              methodSpy();
              return [req, param, additional];
            };
          })
        );

        // Call it twice.
        converted(request, "hello");
        const result = converted(request, "hello");

        expect(result).toEqual([request, 42, "hello"]);
        expect(constructorSpy).toHaveBeenCalledTimes(2);
        expect(methodSpy).toHaveBeenCalledTimes(2);
      });
    });
  });
});
