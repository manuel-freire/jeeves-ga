/**
 * Jeeves, a simple JS generic genetic algorithm library, designed
 * to be (somewhat) Wooster-friendly. Right ho!
 * 
 * <small>
 * <b>copyright</b> 2011, e-UCM, Universidad Complutense de Madrid<br>
 * <b>license</b> GNU LGPL v3 or later; contact authors for other licenses<br>
 * </small>
 *
 * @author manuel.freire@fdi.ucm.es
 *
 * @fileOverview Utility functions used throughout Jeeves
 */

/**
 * Crockford-inheritance
 * @example
 *  // to make myDerived inherit from myBase, write
 *  myDerived.prototype = jv.extend(myBase)
 */
jv.extend = function(constructor) {
    /** @constructor */
    var anon = function() {}
    anon.prototype = constructor.prototype || constructor
    return new anon()
}

/**
 * copies all properties from src to dst
 */
jv.copy = function(src, dst) {
    for (var name in src) {
        if (src.hasOwnProperty(name)) 
            dst[name] = src[name];
    }    
    return dst
}

/**
 * swaps two indices within an array
 * @param {Array<*>} data
 * @param {number} a index within data
 * @param {number} b index within data
 */
jv.swap = function(data, a, b) {
    var aux = data[a]
    data[a] = data[b]
    data[b] = aux
}

/**
 * Binary search in a sorted array; returns last index i
 * such that x <= array[i]
 */
jv.bsearch = function(array, x) {
    var lo = 0
    var hi = array.length
    var mid = Math.floor((hi-lo)/2)
    for  (/* */; lo < mid; mid=Math.floor((hi-lo)/2 + lo)) {
        var v = array[mid]
        if (x == v) {
            return mid
        } else if (x < v) {
            hi = mid
        } else {
            lo = mid
        }
    }
    return lo // == hi
}

/**
 * Shuffles an array, using Fisher-Yates
 */
jv.shuffle = function(array) {
    var current, top = array.length;
    if (top) while(--top) {
        current = Math.floor(jv.random() * (top + 1))
        jv.swap(array, current, top)
    }
    return array;       
}

/**
 * Returns a random number in [0,1[; could be subclassed to support
 * seeding or other RNGs. Jeeves *always* uses this generator
 */
jv.random = function() {
    return Math.random()
}
