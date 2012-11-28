/*
 * Creates a fully-configured Jeeves GA 
 * that finds the highest point in a set
 */
function Simple(iterationsPerStep) {

    jv.logLevel = jv.logLevels.INFO

    // euclidean distance
    function dist(x1, y1, x2, y2) {
        var dx = x1-x2
        var dy = y1-y2
        return Math.sqrt(dx*dx + dy*dy)
    }

    // a chromosome for finding the x,y pair that is closest to .5,.5
    var SimpleChromosome = jv.createChromosome({
        show: function(data) { 
            return "(" + data.x + ", " + data.y + ")"
        },
        evaluate: function(data) {
            return dist(data.x, data.y, .5, .5);
        },
        mutate: function(data) {
            if (jv.random() < .5) {
                data.x += (jv.random()-.5)
            } else {
                data.y += (jv.random()-.5)
            }            
        },
        initialize: function() {
            return {x:jv.random() * 2, y:jv.random() * 2}
        },
        pairCrossover: function(data, other) {
			var a = data;
			var b = other;
            var c = new SimpleChromosome({
                x:(a.data.x + b.data.x)/2, 
                y:(a.data.y + b.data.y)/2
            });
            if (jv.isDebug()) {
                jv.debug("A::" + a.dump())
                jv.debug("B::" + b.dump())
                jv.debug("C::" + c.dump())             
            }
            return [new SimpleChromosome(c)];
        }		
    })
    
    // ga using this chromosome with several custom fields
    var ga = new jv.GA({     
		plotOffset: 0,
		plotData: [],
		
        chromosome: SimpleChromosome,
        maxIterations: iterationsPerStep,
        populationCount: 10,
        mutationRate: .2,
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
