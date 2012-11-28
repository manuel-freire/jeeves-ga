/*
 * Creates a fully-configured Jeeves GA 
 * that finds the highest point in a set
 */
function Simple(generations, popSize) {

    jv.logLevel = jv.logLevels.DEBUG

    // a chromosome for finding the x,y pair that is closest to .5,.5
    var SimpleChromosome = jv.createChromosome({
		pretty: function() {
			return this.show(this.data);
		},
        show: function(data) { 
            return "(" + data.x + ", " + data.y + ")"
        },
        evaluate: function(data) {
			var dx = data.x - .5;
			var dy = data.y - .5;
			return dx*dx + dy*dy;
        },
        copyData: function(data) {
            return {x: data.x, y: data.y};
        },		
        mutate: function(data) {
            if (jv.random() < .5) {
                data.x += (jv.random()-.5)*.1
            } else {
                data.y += (jv.random()-.5)*.1
            }            
        },
        initialize: function() {
            return {x:jv.random() * 2, y:jv.random() * 2}
        },
        crossover: function(data, other) {
			var a = data;
			var b = other;
            var c = {
                x:(a.x + b.x)/2, 
                y:(a.y + b.y)/2
            };
            if (jv.isDebug()) {
                jv.debug("A::" + this.show(a))
                jv.debug("B::" + this.show(b))
                jv.debug("C::" + this.show(c))
            }
            return [new SimpleChromosome(c)];
        }		
    })
    
    // ga using this chromosome with several custom fields
    var ga = new jv.GA({     
		plotOffset: 0,
		plotData: [],
		
        chromosome: SimpleChromosome,
        maxIterations: generations,
        populationCount: popSize,
        mutationRate: .05,
        selectParents: jv.Selections.roulette,
        refineFitness: jv.Refinements.createNormalizer(.1, true),
        reset: function() {
            // resets plot data for convergence plots
            this.plotData = [];
			this.plotOffset = 0;
        },

        finished: function() {
            if (this.iterations%1000 == 0) {
                jv.log("...Generation " 
                    + this.iterations + " : " 
                    + this.bestChromosome.dump())
            }
            this.dump("Population-at-end:")
            this.plotData.push({
                x:this.iterations + this.plotOffset++, 
                y:this.bestChromosome.fitness
            })            
            
            return this.iterations == this.maxIterations            
        }
    })
	ga.populate();
    return ga;
}
