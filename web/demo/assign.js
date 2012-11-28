/*
 * Creates a fully-configured Jeeves GA 
 * that finds an assignment of people to groups
 */
function Assign(generations, popSize) {

    jv.logLevel = jv.logLevels.INFO

	/**
	 * family should be an integer
	 * name, a string
	 * e-mail, an e-mail address (for final result generation)
	 * give, an object of the form {index1: boolean1, index2: boolean2}
	 * take, an object of the same form
	 * 
	 * (remember the goal of this GA is to minimize cost)
	 * if give is provided, -.5 cost will be awarded for each persons with an index
	 * in the list that is given to while true, and +.5 will be awarded if the person
	 * is given to while false. Intuitively, who do you want to give to, and who
	 * do you *not* want to give to.
	 */
    function Person(family, email, name, give, take) {
        this.family = family;
		this.email = email;
        this.name = name;
		this.give = give || {}
		this.take = take || {}
    }    

	//
	// if the initial data has not been loaded externally, substitute for defaults
	//
	var initial = initial || [
		// 0
        new Person(1, "0@example.com", "Little Joe"),
        new Person(1, "1@example.com", "Anne"),
        new Person(1, "2@example.com", "Michael"),

		// 3
        new Person(0, "3@example.com", "Uncle Joe"),
        new Person(0, "4@example.com", "Sophie", {}, {11: false, 12: false}),
        new Person(0, "5@example.com", "Robert (Bobbie)", {7: true}),
		new Person(0, "6@example.com", "Sue (Bobbie's fiancé)", {2: true}, {2: true}),
        new Person(0, "7@example.com", "Laura", {1: true}, {1: true}),

		// 8
        new Person(2, "8@example.com", "Steph"),
        new Person(2, "9@example.com", "Jonathan"),
        new Person(2, "a@example.com", "Ned"),

		// 11
        new Person(3, "b@example.com", "Mary", {1: false}),
        new Person(3, "c@example.com", "Susan", {1: false}),
        new Person(3, "d@example.com", "Suzette", {8: true, 8: true}),
        new Person(3, "e@example.com", "Ferdinand"),
	];

    function swap(data, a, b) {
        var aux = data[a]
        data[a] = data[b]
        data[b] = aux
    }
    
	/**
	 * a chromosome for assigning presents; interpreted as an array
	 * [0 ... length*2 -1], where person i must give presents to 
	 * data[i] and data[i+length]
	 */
    var AChromosome = jv.createChromosome({
        show: function(data) { 
            return "(" + data.slice(0, initial.length).join(" ") + " -- " 
                       + data.slice(initial.length).join(" ") + ")"
        },
        pretty: function() {
			var rdata = new Array(initial.length*2);
			for (var i=0, j=initial.length; i<initial.length; i++, j++) {
				rdata[this.data[i]] = i;
				rdata[this.data[j]+initial.length] = i;
			}
            var out = []
			for (i=0, j=initial.length; i<initial.length; i++, j++) {
                out.push(initial[i].email + " \t" + initial[i].name + " " + this.evaluateSingle(i, this.data, rdata));
                out.push("->\t" + initial[this.data[i]].name);
                out.push("->\t" + initial[this.data[j]].name);
                out.push("<-\t" + initial[rdata[i]].name);
                out.push("<-\t" + initial[rdata[j]].name);
            }
            return out.join("\n")
        },
		evaluateSingle: function(i, data, rdata) {
			var j = i + initial.length;
			var bad = 0;
			
			// not twice to same
			if (data[i] == data[j]) bad += 1
			// not to own family
			if (initial[i].family == initial[data[i]].family) bad += 1
			if (initial[i].family == initial[data[j]].family) bad += 1
			// personal preferences
			var pgi = initial[i].give[data[i]];
			if (pgi !== undefined) {
				bad += (pgi) ? -.5 : +.5;
			}
			var pgj = initial[i].give[data[j]];
			if (pgj !== undefined) {
				bad += (pgj) ? -.5 : +.5;
			}
			var pti = initial[i].take[rdata[i]];
			if (pti !== undefined) {
				bad += (pti) ? -.5 : +.5;
			}
			var ptj = initial[i].take[rdata[j]];
			if (ptj !== undefined) {
				bad += (ptj) ? -.5 : +.5;
			}
			return bad;
		},
        evaluate: function(data) {
			var rdata = new Array(initial.length*2);
			for (var i=0, j=initial.length; i<initial.length; i++, j++) {
				rdata[data[i]] = i;
				rdata[data[j]+initial.length] = i;
			}
            var bad = 0;
            for (i=0; i<initial.length; i++) {
				bad += this.evaluateSingle(i, data, rdata);
            }
            return bad;
        },
        copyData: function(data) {
            return data.slice(0)
        },
        mutate: function(data) {
            var i = jv.random() < .5 ? 0 : initial.length
            var a = jv.random() * initial.length
            var b = jv.random() * initial.length
            swap(data, a+i, b+i)
        },
        initialize: function() {
            var first = [], second = [];
            for (var i=0; i<initial.length; i++) first[i] = second[i] = i
            jv.shuffle(first);
            jv.shuffle(second);
            var data = first.concat(second);
            return data;
        },
		crossover: function(data, other) { 
            var da=data, db=other;
            var d1 = [], d2 = []
            xo(da, db, d1, d2, 0, initial.length)
            xo(da, db, d1, d2, initial.length, initial.length)
            var c1 = new AChromosome(d1)
            var c2 = new AChromosome(d2)
            if (jv.isDebug()) {
                jv.debug("A:  " + this.show(da))
                jv.debug("B:  " + this.show(db))
                jv.debug("C1: " + this.show(d1))
                jv.debug("C2: " + this.show(d2))
            }
            return [new AChromosome(d1), new AChromosome(d2)];
		}
    })
    
    function xo(da, db, c1, c2, offset, n) {
        var s1 = {}, s2 = {}
        var r = jv.random() * n
        var j, k
        for (var i=0; i<n; i++) {
            if (i<r) {
                c1.push(da[offset+i])
                s1[da[offset+i]] = true
                c2.push(db[offset+i]);
                s2[db[offset+i]] = true;
            } else {
                for (j=0; j<n; j++) {
                    k = (db[offset+i]+j)%n;
                    if ( ! s1[k]) { s1[k] = true; c1.push(k); break; }
                }
                for (j=0; j<n; j++) {
                    k = (da[offset+i]+j)%n;
                    if ( ! s2[k]) { s2[k] = true; c2.push(k); break; }
                }
            }
        }
    }
       
    // ga using this chromosome with several custom fields
    var ga = new jv.GA({
        
		plotOffset: 0,
		plotData: [],

		chromosome: AChromosome,
        maxIterations: generations,
        populationCount: popSize,
        elitism: 2,
        mutationRate: .1,
        selectParents: jv.Selections.roulette,
        refineFitness: jv.Refinements.createNormalizer(.2, true),
        reset: function() {
            // resets plot data for convergence plots
            this.plotData = [];
			this.plotOffset = 0;
        },
        finished: function() {
            if (this.iterations%1000 == 0) {
                jv.log("...Generation " 
                    + this.iterations + " : " 
                    + this.bestChromosome.dump());
            }
            this.dump("Population-at-end:");
            this.plotData.push({
                x:this.iterations + this.plotOffset++, 
                y:this.bestChromosome.fitness
            });
            
            return this.iterations == this.maxIterations;            
        }
    })
	ga.populate();
    return ga;
}
