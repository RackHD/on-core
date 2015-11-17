// Copyright 2015, EMC, Inc.
/*global __dirname:false*/

'use strict';
/**
 * Sets up the di helper extenstions to Injector prototype and returns an object
 * with helper methods.
 *
 * Sample usage of these helpers....
 * var di = require('di');
 * var dih = require('renasar-common').dihelper(di);
 * var injector =
 *     new di.Injector([
 *       dih.requireWrapper('async', 'async'),
 *       dih.requireWrapper('lodash', 'lodash'),
 *       dih.simpleWrapper(require('eventemitter2').EventEmitter2, 'eventemitter'),
 *       dih.requireWrapper('moment', 'moment'),
 *       dih.requireWrapper('mongodb', 'mongodb'),
 *       dih.requireWrapper('mongoose', 'mongoose'),
 *       dih.requireWrapper('node-uuid', 'uuid'),
 *       dih.simpleWrapper(
 *           function() {
 *             var Q = require('q');
 *             Q.longStackSupport = true;
 *             return Q; }, 'q'),
 *       dih.requireWrapper('readable-stream', 'stream'),
 *       require('./mocks').mockLogger
 *       dih.requireWrapper('renasar-model', 'renasar-model')
 *     ]);
 * var _ = injector.get('lodash');
 * var logger = injector.get('logger');
 * logger.info(_.VERSION);
 *
 * @param {function|object} di is the instance of the direct injection library
 *                          di.js to be extended
 * @param {string} [defaultDirectory] - used to set diHelper default directory
 *                                      for requires
 * @returns {object} diHelper functions
 */
module.exports = setupDiHelper;

function setupDiHelper(di, defaultDirectory) {
  var resolve = require('resolve'),
      _ = require('lodash'),
      glob = require('glob');

  /**
   * allows for the createion of a child injector easily, useful when you want a fresh function
   * with new transient scoped objects (sugar syntax)
   * @param {*} token
   * @returns {*} the same token that was provided with a freshly scoped child injector
   */
  di.Injector.prototype.getAsChild = function getAsChild(token) {
    var childInjector = this.createChild([token]);
    return childInjector.get(token);
  };

  /**
   * executes the function provided last in the argument list with the provided injectables,
   * must be in the order of the arguments expected by the function.
   * {...object} several objects can be supplied and these will be used as the parameters to
   *             the function. the objects can be plain objects, or tokens that exist in the
   *             injector.  If there is a object you're using as a token (for instance a text
   *             string) that you don't want to be resolved by the injector (i.e. you want to
   *             pass the string 'logger' but there is a module registerd with the Injector
   *             with a token of the text string 'logger') then you can easily opt out of
   *             injection by supplying a simple object with only one property called 'literal'
   *             for instance {literal:'logger'} will be transformed by this exec into 'logger'
   *             the string without resolving it in the di framework.  If the argument passed is
   *             NOT a literal or a token it will be passed through with no mofificaiton.
   * {function} last parameter has to be a function that should be invoked with the resolved
   *            arguments
   * @returns {*} the injected function's result
   */
  di.Injector.prototype.exec = function exec() {
    var self = this;
    var injects = Array.prototype.slice.call(arguments);
    var func = injects.splice(-1)[0];

    if (typeof func !== 'function') {
      throw new Error('last argument must be a function');
    }

    var injectToFunction =
        injects.map(function (inject) {
          // if someone wants to use a string literal, let them with the special syntax of:
          // {literal:'foo'} this also allows them to pass "anything" as a literal that will
          // not go through injection as a parameter... os if they wanted to they could pass
          // {literal:{literal:'bah'}} and the function we are injecting would get
          // {literal:'bah'} with the outer layer unwrapped.  It is just a means of opting out
          // of injection explicitly for this input
          if(typeof inject === 'object' &&
              Object.getOwnPropertyNames(inject).length ===1 &&
              exists(inject.literal)) {
             return inject.literal;
          }
          // if we happen to have a provider for the given object and see the token we're
          // given has a provider then we use it
          if(self._hasProviderFor(inject)) {
            return self.get(inject);
          }
          // if we don't see a provider for that token we just return the object we were
          // given in this map.
          return inject;
        });

    // take the result of the map operation that looked up the information and run with
    // those as arguments.
    return func.apply(func, injectToFunction);
  };

  /**
   * Creates a child injector with with the provided injectables, and executes the function
   * provided as the last argument in the context of the child injector. This can be used to
   * create different "scopes" for injectables.
   * @param {...object} list of values to use as providers for the child injector
   * @param {function} last parameter has to be a function that should be invoked with the
   *                   resolved arguments
   * @returns {*} the injected function's result
   */

  di.Injector.prototype.childExec = function childExec() {
    var self = this;
    var injects = Array.prototype.slice.call(arguments);
    var func = injects.splice(-1)[0];

    if (typeof func !== 'function') {
      throw new Error('last argument must be a function');
    }
    var childInjector;
    var token = _wrapper(func, function execWrapper() {
      return func.apply(childInjector, arguments);
    }, null, injects.map(function (inject) {
      // the function to exec needs to have tokens annotated rather than the providers
      if (inject.annotations && inject.annotations.length) {
        for (var i = 0; i < inject.annotations.length; i += 1) {
          if (inject.annotations[i] instanceof di.Provide) {
            return inject.annotations[i].token;
          }
        }
      }
      return inject;
    }));

    // now we pass in the providers to the child injector constructor
    childInjector = self.createChild(injects.concat([token]));
    return childInjector.get(token);
  };

  /**
   * Returns an array of injectables matching the given pattern.
   * @param {String|RegExp} pattern Can be a regexp or a string with wildcard characters
   *                        (asterisks).
   * @returns {Array.<*>}
   *
   * @example
   * // loads all modules in the utils namespace
   * injector.getMatching('Utils.*');
   * injector.getMatching(/^Utils\..+$/);
   */

  di.Injector.prototype.getMatching = function getMatching(pattern) {
    var self = this;

    var DELIMITER_REGEX = /[.:\/]+/;
    var TOKEN_REGEX = /[^.:\/]+/;

    if (typeof pattern === 'string') {
      pattern = pattern.split(DELIMITER_REGEX).map(function (element) {
        if (element === '*') {
          return TOKEN_REGEX.source;
        }
        return escapeRegExp(element);
      }).join(DELIMITER_REGEX.source);
      pattern = new RegExp(pattern);
    }

    if (!(pattern instanceof RegExp)) {
      throw new Error('pattern must be a string or RegExp');
    }
      //console.log("PAST!");
    var values = [];
    self._providers.forEach(function(provider, token) {
      if (typeof token === 'string' && token.match(pattern)) {
        values.push(self.get(token));
      }
    });
    if (self._parent) {
      values = self._parent.getMatching(pattern).concat(values);
    }
    return values;
  };


  /**
   * Inserts backslashes before all regex special characters.
   * @private
   * @param {string} string
   * @returns {string}
   */
  function escapeRegExp(string) {
    return string.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  }

  /**
   * Check if obj is a string
   * @private
   * @param {*} obj
   * @returns {boolean} true if obj is a string
   */
  function isString(obj){
    return typeof obj === 'string';
  }

  /**
   * Check if obj is a object
   * @private
   * @param {*} obj
   * @returns {boolean} true if obj is a object
   */
  function isObject(obj){
    return typeof obj === 'object';
  }

  /**
   * Check if obj is a function
   * @private
   * @param {*} obj
   * @returns {boolean} true if obj is a function
   */
  function isFunction(obj){
    return typeof obj === 'function';
  }

  /**
   * Check if obj is undefined
   * @private
   * @param {*} obj
   * @returns {boolean} true if obj is undefined
   */
  function exists(obj){
    return typeof obj !== 'undefined';
  }

  /**
   * Apply provide annotation to object
   * @private
   * @param {*} obj
   * @param {string} token string to apply as provide annotation
   */
  function provideName(obj, token){
    if(!isString(token)) {
      throw new Error('Must provide string as name of module');
    }
    di.annotate(obj, new di.Provide(token));
  }
  /**
   * Apply provide promise annotation to object
   * @private
   * @param {*} obj
   * @param {string} providePromiseName string to apply as provide promise annotation
   */
  function providePromise(obj, providePromiseName) {
    if(!isString(providePromiseName)) {
      throw new Error('Must provide string as name of promised module');
    }
    di.annotate(obj, new di.ProvidePromise(providePromiseName));
  }

  /**
   * resolve the type of promise and the name given the underlying object and any overrides
   * @private
   * @param {*} obj
   * @param {string|object} [override] - specify any of the overides
   */
  function resolveProvide(obj, override) {
    var provide = override || obj.$provide;

    if(isString(provide)) {
      return provideName(obj, provide);
    }

    if(isObject(provide)) {
      if (isString(provide.promise)) {
        return providePromise(obj, provide.promise);
      } else if (isString(provide.provide)) {
        return provideName(obj, provide.provide);
      }
    }
  }

  /**
   * Add Inject Annotation
   * @private
   * @param {*} obj
   * @param {string|object} inject
   */
  function addInject(obj, inject) {
    if(!exists(inject)) {
      return;
    }

    var injectMe;

    if (inject === '$injector') {
      injectMe = new di.Inject(di.Injector);
    } else if (isObject(inject)) {
      if(isString(inject.inject)){
        injectMe = new di.Inject(inject.inject);
      } else if(isString(inject.promise)) {
        injectMe = new di.InjectPromise(inject.promise);
      } else if(isString(inject.lazy)) {
        injectMe = new di.InjectLazy(inject.lazy);
      }
    } else {
      injectMe = new di.Inject(inject);
    }

    di.annotate(obj, injectMe);
  }

  /**
   * adds provided annotations to obj
   * @private
   * @param obj
   * @param override
   */
  function resolveInjects(obj, override){
    var injects = obj.$inject || override;

    if (exists(injects)) {
      if (!Array.isArray(injects)) {
        injects = [injects];
      }
      injects.forEach(function addInjects(element) {
        addInject(obj, element);
      });
    }
  }

  /**
   * adds @TransientScope annotation if called for
   * @private
   * @param obj
   * @param override
   */
  function resolveTransientScope(obj, override){
    var transientScope = obj.$transientScope || override;

    if (transientScope) {
      di.annotate(obj, new di.TransientScope());
    }
  }

  /**
   * Takes any object and makes it an injectable (object, function, whatever)
   * @param {*} originalObject
   * @param {function} wrappedObject
   * @param {string|object} provide is either an array or string representing the service that
   *                        this object provides
   * @param {string|string[]|object|object[]} injects - is either a single string or array of
   *                                          strings of module names to be injected
   * @param {boolean} [isTransientScope=false] - whether to set @TransientScope annotation
   * @returns {*}
   */
  function _wrapper(originalObject, wrappedObject, provide, injects, isTransientScope) {
    // TODO(@davequick): discuss with @halfspiral whether isTransientScope might just
    // better be an array of Annotations
    wrappedObject.$provide = originalObject.$provide;
    wrappedObject.$inject = originalObject.$inject;
    wrappedObject.$transientScope = originalObject.$transientScope;

    resolveProvide(wrappedObject, provide);
    resolveInjects(wrappedObject, injects);
    resolveTransientScope(wrappedObject, isTransientScope);

    return wrappedObject;
  }

  /**
   * Takes any object and makes it an injectable (object, function, whatever), returns it
   * exactly as it was originally provided to us, with no injection happening on the way out -
   * super handy for constants and objects and functions that are not di.js aware
   * @param {*} obj
   * @param {string|object} provide is either an array or string representing the service that
   *                        this object provides
   * @param {string|string[]|object|object[]} injects - is either a single string or array of
   *                                          strings of module names to be injected
   * @param {boolean} [isTransientScope=false] - whether to set @TransientScope annotation
   * @returns {*}
   */
  function simpleWrapper(obj, provide, injects, isTransientScope) {
    // TODO(@davequick): discuss with @halfspiral whether isTransientScope might just
    // better be an array of Annotations
    var wrappedObject = function wrapObject() {
      return obj;
    };
    return _wrapper(obj, wrappedObject, provide, injects, isTransientScope);
  }

  /**
   * This is meant to be used where you have an injectable that might be an injectable function.
   * if it is we want to actually have the injection happen while it is being returned.
   * @param obj
   * @param provide
   * @param injects
   * @param isTransientScope
   * @returns {*}
   */
  function injectableWrapper(obj, provide, injects, isTransientScope) {
    // TODO(@davequick): discuss with @halfspiral whether isTransientScope might just better
    // be an array of Annotations
    var wrappedObject = function wrapOrCreateObject() {
      if(isFunction(obj) && (exists(obj.$provide) || exists(obj.$inject) || provide || injects)){
        var instance = Object.create(obj.prototype);
        return obj.apply(instance,arguments) || instance;
      }
      return obj;
    };
    return _wrapper(obj, wrappedObject, provide, injects, isTransientScope);
  }

  /**
   * Takes any injection aware function and overrides provides/inject in place of the existing
   * notations without overwriting them on the original object
   * @param {function} obj
   * @param {string|object} provides is either an array or string of things this object provides
   * @param {string|string[]|object|object[]} [injects] - is either a single string or array of
   *                                                     strings of module names to be injected
   * @returns {*}
   */
  function overrideInjection(obj, provides, injects) {
    if (!isFunction(obj)) {
      throw new Error('Expecting injectable function.');
    }

    function setupEnclosedInjectable() {
      var injected = arguments;
      return (function(){return obj.apply(obj, injected);}());
    }

    var overriddenObject = setupEnclosedInjectable;
    resolveProvide(overriddenObject, provides);
    resolveInjects(overriddenObject, injects);

    return overriddenObject;
  }

  /**
   * Attempt to fetch the supplied filename, no exceptions on fail
   * @private
   * @param {string} requirable to try and require
   * @param {string} [directory] - directory to attempt resolving filename path with
   * @returns {*} the result of the require, undefined if not found
   */
  function _requireFile(requirable, directory) {
    var required;
    try{
      var res = resolve.sync(requirable, { basedir: directory});
      required = require(res);
    }
    catch(err) {
      required = (void 0);
    }
    return required;
  }


  /**
   * internal helper for the exposed require helpers to cut down on replication of code.
   * @private
   * @param {string} requireMe is string passed to require()
   * @param {string|object} [provides] - is either an array or string of things this object provides
   * @param {string|string[]|object|objects[]} [injects] - is either a single string or array of
   *                                                     strings of module names to be injected
   * @param {string} [currentDirectory] - directory to attempt first require from
   * @param {function} next function (wrap or override) to call with the result of the require
   * @returns {*}
   */
  function _require(requireMe, provides, injects, currentDirectory, next) {

    var requireResult =  _requireFile (requireMe, currentDirectory) ||
                         _requireFile (requireMe, defaultDirectory) ||
                         _requireFile (requireMe, __dirname) ||
                         _requireFile (requireMe, (void 0));

    if(!exists(requireResult)) {
      var directories = 'directories:(';
      directories += exists(currentDirectory) ? currentDirectory + ', ' : '';
      directories += exists(defaultDirectory) ? defaultDirectory + ', ' : '';
      directories += __dirname + ')';
      throw new Error('dihelper incapable of finding specified file for require filename:' +
          requireMe + ', ' + directories);
    }

    if (typeof provides === 'undefined' && !exists(requireResult.$provide)) {
    //TODO(@davequick): also look for annotations once ES6, for now can't because you would
    // receive a different di instance if you did require('di/dist/cjs/annotations') so class
    // equalities would not work.  Once all is ES6, then instanceof for the classes should work
    // and add it here.  For now you have to have a string or object on yourmodule.$provide or
    // it will be overwritten.

      provides = requireMe;
    }

    return next(requireResult, provides, injects);
  }

  /**
   * this one does the require for you and returns an object that is annotated
   * @param requireMe is string passed to require()
   * @param [provides] - is either an array or string of things this object provides
   * @param [injects] - is either a single string or array of strings of module names to be injected
   * @param [directory] - to attempt first require from
   * @returns {*}
   */
  function requireWrapper(requireMe, provides, injects, directory) {
    return  _require(requireMe, provides, injects, directory, simpleWrapper);
  }

  /**
   * requireGlob requires all files matching the glob pattern and provides
   * a list of injectables based on that pattern.
   * @param  {String} pattern A glob pattern to search for files to require.
   * @return {Array.<Object>} A list of require'd objects to provide to the injector.
   */
  function requireGlob(pattern) {
    return _.map(glob.sync(pattern), function (file) {
        var required = require(file);

        resolveProvide(required);
        resolveInjects(required);

        return required;
    });
  }

  /**
   * requireGlobInjectables requires all files matching the glob pattern and
   * provides a list of injectables based on that pattern. These files will
   * be wrapped using {@link injectableWrapper}.
   * @param  {String} pattern A glob pattern to search for files to require.
   * @return {Array.<Object>} A list of require'd objects to provide to the injector.
   */
  function requireGlobInjectables(pattern) {
    return _.map(glob.sync(pattern), function (file) {
        return injectableFromFile(file);
    });
  }

  /**
   * expecting an injeciton aware function and the function is called with the injectables on get.
   * @param requireMe is string passed to require()
   * @param [provides] - is either an array or string of things this object provides
   * @param [injects] - is either a single string or array of strings of module names to be injected
   * @param [directory] - to attempt first require from
   * @returns {*}
   */
  function injectableFromFile(requireMe, provides, injects, directory) {
    return  _require(requireMe, provides, injects, directory, injectableWrapper);
  }

  /**
   * overides the given require with the injectables provided
   * @param requireMe is string passed to require()
   * @param [provides] - is either an array or string of things this object provides
   * @param [injects] - is either a single string or array of strings of module names to be injected
   * @param [directory] - to attempt first require from
   * @returns {*}
   */
  function requireOverrideInjection(requireMe, provides, injects, directory) {
    return _require(requireMe, provides, injects, directory, overrideInjection);
  }


  return {
    value: simpleWrapper,
    fromFile: requireWrapper,
    injectableFromFile: injectableFromFile,
    overrideValue: overrideInjection,
    overrideFromFile: requireOverrideInjection,

    injectableWrapper: injectableWrapper,
    simpleWrapper: simpleWrapper,
    requireWrapper: requireWrapper,
    requireGlob: requireGlob,
    requireGlobInjectables: requireGlobInjectables,
    overrideInjection: overrideInjection,
    requireOverrideInjection: requireOverrideInjection,
      testFunctions: {
          provideName: provideName,
          providePromise: providePromise,
          resolveProvide: resolveProvide,
          addInject: addInject,
          resolveTransientScope: resolveTransientScope,
          injectableWrapper: injectableWrapper,
          overrideInjection: overrideInjection,
          _requireFile: _requireFile,
          _require: _require,
          requireGlobInjectables: requireGlobInjectables,
          injectableFromFile: injectableFromFile,
          requireOverrideInjection: requireOverrideInjection
      }
  };
}
