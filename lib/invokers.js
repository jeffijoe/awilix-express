"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var awilix_1 = require("awilix");
var utils_1 = require("awilix/lib/utils");
/**
 * Creates either a function invoker or a class invoker, based on whether
 * the argument can be classified as a class or not. Uses Awilix' `isClass` utility.
 *
 * @param functionOrClass
 * The function or class to invoke.
 *
 * @param opts
 * Resolver options for the class/function.
 */
function makeInvoker(functionOrClass, opts) {
    return utils_1.isClass(functionOrClass)
        ? /*tslint:disable-next-line*/
            makeClassInvoker(functionOrClass, opts)
        : /*tslint:disable-next-line*/
            makeFunctionInvoker(functionOrClass, opts);
}
exports.makeInvoker = makeInvoker;
/**
 * Returns a function that when called with a name,
 * returns another function to be used as Express middleware.
 * That function will run `fn` with the container cradle as the
 * only parameter, and then call the `methodToInvoke` on
 * the result.
 *
 * @param, {Function} fn
 * @return {(methodToInvoke: string) => (req) => void}
 */
function makeFunctionInvoker(fn, opts) {
    return makeResolverInvoker(awilix_1.asFunction(fn, opts));
}
exports.makeFunctionInvoker = makeFunctionInvoker;
/**
 * Same as `makeInvoker` but for classes.
 *
 * @param  {Class} Class
 * @return {(methodToInvoke: string) => (req) => void}
 */
function makeClassInvoker(Class, opts) {
    return makeResolverInvoker(awilix_1.asClass(Class, opts));
}
exports.makeClassInvoker = makeClassInvoker;
/**
 * Returns a function that when called with a method name,
 * returns another function to be used as Express middleware.
 * That function will run `container.build(resolver)`, and
 * then call the method on the result, passing in the Express request
 * and rest of the parameters.
 *
 * @param, {Resolver} resolver
 * @return {(methodToInvoke: string) => (req) => void}
 */
function makeResolverInvoker(resolver) {
    /**
     * 2nd step is to create a method to invoke on the result
     * of the resolver.
     *
     * @param  {string} methodToInvoke
     * @return {(req) => void}
     */
    return function makeMemberInvoker(methodToInvoke) {
        /**
         * The invoker middleware.
         *
         * @param  {E.Request} req
         * @param  {...*} rest
         * @return {*}
         */
        return function memberInvoker(req) {
            var rest = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                rest[_i - 1] = arguments[_i];
            }
            var container = req.container;
            var resolved = container.build(resolver);
            if (!resolved[methodToInvoke]) {
                throw Error("The method attempting to be invoked, '" + methodToInvoke + "', does not exist on the controller");
            }
            return resolved[methodToInvoke].apply(resolved, [req].concat(rest));
        };
    };
}
exports.makeResolverInvoker = makeResolverInvoker;
/**
 * Injects dependencies into the middleware factory when the middleware is invoked.
 *
 * @param factory
 */
function inject(factory) {
    var resolver = getResolver(factory);
    /**
     * The invoker middleware.
     */
    return function middlewareFactoryHandler(req) {
        var rest = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            rest[_i - 1] = arguments[_i];
        }
        var container = req.container;
        var resolved = container.build(resolver);
        return resolved.apply(void 0, [req].concat(rest));
    };
}
exports.inject = inject;
/**
 * Wraps or returns a resolver.
 */
function getResolver(arg) {
    if (typeof arg === "function") {
        /*tslint:disable-next-line*/
        return awilix_1.asFunction(arg);
    }
    return arg;
}
//# sourceMappingURL=invokers.js.map