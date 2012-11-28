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
 * @fileOverview Main classes
 */

/**
 * Namespace definition for Jeeves.
 *
 *@namespace The top-level Jeeves namespace, <tt>jv</tt>.
 */
var jv = {}
       
/**
 * Constructs a new chromosome. Not to be used directly - you should create
 * a subclass using {@link pv.createChromosome} instead
 *
 * @class An individual within a GA's population
 *
 * @constructor
 * @param data application-specific data; copied using {@link pv.Chromosome.copyData}
 * @param {number} [fitness] domain-dependent fitness of this
 * individual, calculated using {@link pv.Chromosome.evaluate};
 * only passed when cloning individuals.
 * @param {number} [goodness] derived goodness of this individual, used
 * for genetic-algorithm selection purposes.
 * Must be positive, and bigger is considered better. Derived from the
 * fitness values using {@link pv.GA.refineFitness}
 */
jv.Chromosome = function(data, fitness, goodness) {
    /// chromosome id; sequential (see {@link jv.Chromosome.lastId})
    this.id = jv.Chromosome.lastId++
    /// chromosome fitness; refreshed by evaluate()
    this.fitness = fitness
    /// chromosome goodness; used instead of fitness by select()
    this.goodness = goodness
    /// chromosome data; manipulated by subclasses
    this.data = data
}
/** Tracks total number of chromosomes created */
jv.Chromosome.lastId = 0;
jv.Chromosome.prototype = {
    /**
     * Constructor to use when cloning
     */
    constructor: jv.Chromosome,    
    /**
     * Copies an individual
     * @return deep copy of this chromosome, with correct class
     */
    copy: function() {
        return new this.constructor(
            this.copyData(this.data),
            this.fitness, this.goodness
        )
    },
    /**
     * Returns this chromosome, as a string. Calls {@link #show} to
     * generate a string-representation of the data
     * @return {string} representing individual
     */
    dump: function() {
        return this.id + ": " + 
               this.show(this.data) + " = " +              
               this.goodness + " => " + this.fitness;
    },    
    /**
     * OPTIONAL OVERRIDE: returns a formatted string
     * displaying the data; called by {@link #dump}
     * @param {*} data individual's data
     * @return {string} representing individual's data
     */
    show: function(data) { 
        return data.toString()
    },
    /**
     * OPTIONAL OVERRIDE: returns a (potentially deep) copy of data
     * @param {*} data individual's data
     * @return copy of this data, so that mutation and crossover do not provoke
     * visible changes to the original. The default implementation only
     * works with simple objects.
     */
    copyData: function(data) {       
        return jv.copy(data, {})
    },
    /**
     * OVERRIDE: updates chromosome fitness; can be 
     * refined using {@link refineFitness} - so this should
     * reflect actual problem-domain fitness
     * @param {*} data individual's data
     * @return {number} a number representing
     */
    evaluate: function(data) { 
        jv.error("no evaluation function!")
        return 0;
    },
    /**
     * OVERRIDE: updates chromosome fitness; can be 
     * refined using {@link refineFitness} - so this should
     * reflect actual problem-domain fitness
     * @param {*} data individual's data
     */
    mutate: function(data) {
        jv.error("no mutation function!") 
    },
    /**
     * OVERRIDE: returns initial data for an individual
     * @return {*} for this jv.Chromosome subtype
     */
    initialize: function() {
        jv.error("no initialization function!")
    },
    /**
     * OVERRIDE: crosses this individual's data with another one's, and returns the
     * offspring
     * @param {*} data for this chromosome (avoids referral to 'this')
     * @param {*} other: data for the other chromosome
     * @return {Array.<{jv.Chromosome}>} array of offspring; remember to create them with
     * the adequate problem-specific jv.Chromosome subclass. May be empty
     * (if there is no chemistry between he pair)
     */
    crossover: function(data, other) {
        jv.error("no crossover function!")
        return [];
    }
}

/**
 * Creates a fully-configured jv.Chromosome subclass, prepared
 * for a specific problem. The new class has a constructor 
 * identical to that of jv.Chromosome
 * 
 * overrides: object with
 *     show - string representation of chromosome data (used from dump())
 *     evaluate - returns chromosome fitness
 *     mutate - mutates chromosome data
 *     initialize - initializes and returns all-new chromosome data
 */
jv.createChromosome = function(overrides) {
    var sub = function(data, fitness, goodness) {
        jv.Chromosome.call(this, data, fitness, goodness)
    }
    sub.prototype = jv.extend(jv.Chromosome)
    sub.prototype.constructor = sub
    jv.copy(overrides, sub.prototype)
    return sub
}

/**
 * Creates a population
 * chromosome - base chromosome (will call its constructor),
 *              built by createCromosome
 * count - number of individuals to create
 */
jv.createPopulation = function(chromosome, count) {
    var pop = []
    for (var i=0; i<count; i++) {
        pop.push(new chromosome.prototype.constructor(
            chromosome.prototype.initialize()))
    }
    return pop
}

/**
 * Compare chromosome fitness (problem domain-values)
 */
jv.compareFitness = function(a, b) {
    var rc = b.fitness - a.fitness
    return (rc == 0) ? a.id - b.id : rc;
}

/**
 * Compare chromosome goodness (GA-domain values; must be maximized)
 */
jv.compareGoodness = function(a, b) {
    var rc = b.goodness - a.goodness
    return (rc == 0) ? a.id - b.id : rc;
}

/**
 * A generic algorithm. You generally only use one, so there should be no
 * need to create subclasses.
 *
 * @class A generic genetic GA, ready to solve your problems. If you have a
 * Chromosome subclass that can represent possibla answers, a fitness function,
 * and mutation and crossover operators, that is.
 *
 * @constructor
 *
 * @param {Object} options overwrites defaults set by GA. Potentially,
 * @param {jv.Chromosome} options.chromosome
 *      problem-specific chromosome constructor, a subclass of
 *      {@link jv.Chromosome} created with {@link jv.createChromosome}
 *
 * @param {function()} [options.reset]
 *      initialization to do at the beginning of runs (when populate() gets called)
 *      {@link jv.GA.reset}
 * @param {function()} [options.finished]
 *      called after each iteration; should return true if run should stop
 *      {@link jv.GA.finished}
 * @param {function()} [options.refineFitness]
 *      called by {@link jv.GA.evaluate}; should
 *      updates chromosome goodness for all chromosomes (by default, just
 *      uses the current value of fitness). See
 *      {@link jv.GA.refineFitness}
 * @param {function()} [options.selectParents]
 *      performs parent selection. Several options are available in
 *      {@link jv.Selections}. See
 *      {@link jv.GA.selectParents}
 *
 * @param {number} [options.crossoverRate]
 *      between 0 and 1, fraction of population to replace in each iteration
 * @param {number} [options.mutationRate]
 *      between 0 and 1, probability of mutating a chromosome in each generation
 * @param {number} [options.elitism]
 *      the best n get promoted automatically to the next generation. Largely
 *      redundant if crossoverRate is not 1
 * @param {number} [options.maxIterations]
 *      max iterations under default convergence rule
 * @param {number} [options.iterations]
 *      current iteration count
 * @param {number} [options.populationCount]
 *      population size
 */
jv.GA = function(options) {
        
    // parameters

    /// {number} population ration replaced in each iteration (rest is best-of-selected)
    this.crossoverRate = 0.5
    /// {number} chance of mutation in any one chromosome
    this.mutationRate = 0.1
    /// {number} top-elitism get guaranteed promotion to next generation
    this.elitism = 0
    /// {number} max iterations under default convergence rule
    this.maxIterations = 100
    /// {number} current iteration count
    this.iterations = 0
    /// {number} population size
    this.populationCount = 10   
    /// {jv.Chromosome} chromosome constructor
    this.chromosome = undefined
       
    // state
    
    /// {Date} time at start-of-run (reset at the start of each run)
    this.startTime = 0
    /// {number} time difference at end-of-run (valid after calling 'run')
    this.runTime = 0
    /// all individuals, possibly sorted
    this.population = []
    /// all selected individuals, prior to crossover
    this.selected = []
    /// all children, in pairs
    this.children = []
    /// best chromosome yet
    this.bestChromosome = null
    
    // apply options, whatever they are
    jv.copy(options, this)
}
jv.GA.prototype = {
    constructor: jv.GA,    
    /**
     * Resets state (calling {@link jv.GA.reset}),
     * and creates an initial population
     * @erturn this
     */
    populate: function() {
        this.reset()
        this.population = jv.createPopulation(
            this.chromosome, this.populationCount)
        this.bestChromosome = null
        return this
    },    
    /**
     * Runs the GA from current state until halting condition is met.
     * when finished, the callback will be called
     * @param {function({jv.GA})} [callback] function to call when finished
     * @return whatever the callback returns, or the best chromosome's
     * data otherwise
     */
    run: function(callback) {
        this.startTime = new Date().getTime()
        this.iterations = 0
        this.evaluate()
        do {
            this.select()
                .crossover()
                .replace()
                .mutate()
                .evaluate()
            this.iterations ++
        } while ( ! this.finished())  
        this.runTime = new Date().getTime() - this.startTime
        return callback ? callback(this) : this.bestChromosome.data;
    },
    /**
     * OPTIONAL OVERRIDE: things to do when resetting. Called at the start of 
     * {@link jv.GA.populate}
     */
    reset: function() {
    },
    /**
     * OPTIONAL OVERRIDE: end condition
     * called by run() after each cycle
     * @return {boolean} true if we should end execution
     */
    finished: function() {
        return this.iterations == this.maxIterations
    },
    /**
     * @private
     * Evaluates all individuals, sorts them by fitness
     * calls refineFitness before sorting
     * updates bestChromosome (if applicable)
     */
    evaluate: function() {
        this.population.forEach(function(chromosome) {
            chromosome.fitness = chromosome.evaluate(chromosome.data)
        })
        this.refineFitness(this.population)
        this.population.sort(jv.compareGoodness)

        // check to see if record has been surpassed
        var generationBest = this.population[0].fitness
        var generationWorst = this.population[this.population.length-1].fitness
        var maximizing = generationBest > generationWorst
        if ( ! this.bestChromosome 
            || (maximizing && generationBest > this.bestChromosome.fitness)
            || ( ! maximizing && generationBest < this.bestChromosome.fitness)) {
            
            this.bestChromosome = this.population[0].copy()
        }        
        return this
    },   
    /**
     * Dumps an entire population to the log, using debug level
     * @param [title] text to log before the dump, only if dump is
     * actually logged (the {@link jv.logLevel} must be low enough
     */
    dump: function(title) {
        if ( ! jv.isDebug()) return
        if (title) jv.debug(title)
        this.population.forEach(function(chromosome) {
            jv.debug(chromosome.dump())
        })
    },
    /**
     * OPTIONAL OVERRIDE: refines an existing evaluation
     * can change fitnesses (for instance, to implement scaling)
     * called *in* evaluate(), before any sorting. See {@link jv.Refinements}
     * for examples that you can use
     */
    refineFitness: function(chromosomes) {
        chromosomes.forEach(function(c) {
            c.goodness = c.fitness
        })
    },
    /**
     * @private
     * selects breedable chromosomes
     * called after refineEvaluation()
     */
    select: function() {
        this.selected = []
        this.selectParents(Math.floor(
            this.crossoverRate * this.population.length))
        return this
    },
    /**  
     * OPTIONAL OVERRIDE: selects parentCount breedable chromosomes
     * from 'population' and copies them over to 'selected[]'
     * called *by* select()
     */
    selectParents: function(parentCount) { 
        jv.Selections.roulette(parentCount)
    },
    /**
     * @private
     * Cross individuals, in pairs
     * called after select()
     */
    crossover: function() {
        this.children = []
        var children = this.children
        var childCount = Math.floor(
            (this.population.length * this.crossoverRate) / 2) * 2;
        
        // parents get to mate
        var bachelors = this.selected.slice(0);
        do {
            jv.shuffle(bachelors)
            for (var i = 0; i+1<bachelors.length && 
                    this.children.length < childCount; i+=2) {
                bachelors[i].crossover(bachelors[i].data, bachelors[i+1].data)
                    .forEach(function(child) { children.push(child) })
            }
        } while (this.children.length < childCount);
        if (this.children.length > childCount) {
            this.children = this.children.slice(0, childCount)
        }
        return this
    },
    /**
     * @private
     * Replace (bad) old individuals with new ones
     * called after crossover()
     */
    replace: function() {
        var nextgen = [].concat(
            this.population.slice(0, this.elitism),
            this.children)
        for (var i=this.population.length-1, j=0; j<nextgen.length; i--, j++) {
            this.population[i] = nextgen[j]
        }
        return this
    },
    /**
     * @private
     * Mutate new generation
     * called after replace()
     */
    mutate: function() {
        var rate = this.mutationRate
        this.population.forEach(function(chromosome) {
            if (jv.random() < rate) {
                chromosome.mutate(chromosome.data)
            }
        })
        return this
    }
}

/**
 * Refinement strategies
 */
jv.Refinements = {
    /**
     * Normalizes fitness values between
     * [1+minScore, minScore]
     * if 'flip' is specified, then applies same
     * normalization but
     */
    createNormalizer: function(minScore, flip) {
        return function(chromosomes) {
            this.dump("Refining Fitness:")
            chromosomes.sort(jv.compareFitness)
            var max = chromosomes[0].fitness
            var min = chromosomes[chromosomes.length-1].fitness
            if (max == min) max ++
            if (flip) {
                chromosomes.forEach(function(c){
                    c.goodness = (max - c.fitness) / (max - min) + minScore               
                })
            } else {
                chromosomes.forEach(function(c){
                    c.goodness = (c.fitness - min) / (max - min) + minScore               
                })                
            }
            this.dump("Fitness updated:")
        }       
    }
}

/**
 * Selection strategies; general form: function(parentCount)
 */
jv.Selections = {
    /**
     * Implements roulette selection
     * @this {jv.GA}
     */
    roulette : function(parentCount) {
        var roulette = []
        var total = 0
        for (var i=0; i<this.population.length; i++) {
            total += this.population[i].goodness
            roulette[i] = total
        }
        for (i=0; i<parentCount; i++) {
            var lucky = total * jv.random()            
            this.selected.push(this.population[
                jv.bsearch(roulette, lucky)].copy())
        }
    }
}

/**
 * Crossover strategies; general form: function(a, b)
 */
jv.Crossovers = {
    /*
     * Crossovers
     */
}
