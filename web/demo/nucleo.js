/*
 * Creates a fully-configured Jeeves GA 
 * that finds an assignment of people to groups
 */
function Assign(generations, popSize, splits, groupSize, studentLeadership, studentHates, leadershipWeight) {

    jv.logLevel = jv.logLevels.INFO
    
    
    jv.debug("Called with g=" + generations + " g= " + popSize + " s= " + splits 
        +  " gs=" + groupSize + " lw=" + leadershipWeight + "; ")

    var initial = []
    var students= {}
    var totalLeadership = 0
    function Student(id, leadership, index) {
        this.id = id
        this.index = index
        this.leadership = leadership
        totalLeadership += leadership
        this.hates = {}
        students[id] = this
    }       
    function addHate(id1, id2) {
        students[id1].hates[id2] = true;
    }
    
    studentLeadership.forEach(function(s) { 
        initial.push(new Student(s[0], s[1], initial.length))
    })
    studentHates.forEach(function(h) {
        addHate(h[0], h[1])
    })

    var avgLeadership = totalLeadership / initial.length
            
    function compareByLeadership(ia, ib) {
        return initial[ib].leadership - initial[ia].leadership
    }
    function compareByGroupLeadership(ia, ib) {
        var sa = 0, sb = 0, i;
        for (i=0; i<ia.length; i++) sa += initial[ia[i]].leadership
        for (i=0; i<ib.length; i++) sb += initial[ib[i]].leadership        
        return sb - sa
    }    
    function compareByGroupSize(ia, ib) {
        return ib.length - ia.length
    }    
    
    function groupLeadershipDelta2(data, offset) {
        var total = 0
        for (var i=0; i<groupSize && i+offset<initial.length; i++) {
            total += initial[data[i+offset]].leadership
        }
        var avg = total / i
        var delta = avgLeadership - avg
        return delta * delta
    }    
    
    function groupHates(data, offset) {
        var hates = 0
        for (var i=0; i<groupSize && i+offset<initial.length; i++) {
            for (var j=0; j<i; j++) {
                if (initial[data[i+offset]].hates[initial[data[j+offset]].id]
                 || initial[data[j+offset]].hates[initial[data[i+offset]].id])
                 hates ++
            }
        }
        return hates
    }           
    
    // a chromosome for finding the x,y pair that is closest to .5,.5
    var AChromosome = jv.createChromosome({
        show: function(data) { 
            var groups = []
            for (var i=0; i<initial.length; i+=groupSize) {
            var group = [];
            for (var j=0; j<groupSize && i+j<initial.length; j++) {
                    group.push(data[i+j])
                }
                groups.push(group.join("+"))
            }
            return "(" + groups.join(", ") + ")"
        },
        pretty: function(data) {
            var groups = [],
                hate = 0,
                delta = 0
            for (var i=0; i<initial.length; i+=groupSize) {
                var group = [];
                for (var j=0; j<groupSize && i+j<initial.length; j++) {
                    group.push(initial[data[i+j]].id)
                }
                var ghate = groupHates(data, i)
                if (ghate > 0) {
                    group.push("!!")
                }
                hate += ghate
                delta += groupLeadershipDelta2(data, i)

                groups.push(group.join("+"))
            }
            hate /= groups.length
            delta /= groups.length
            return groups.join(", ") + " :: hate " + hate + " delta " + delta 
        },
        plottable: function(data) {
            var members = []
            var names = []
            for (var k=0; k<groupSize+1; k++) {
                members.push([])
                names.push([])
            }
            for (var i=0; i<initial.length; i+=groupSize) {
                for (var j=0; j<groupSize; j++) {
                    if (i+j<initial.length) {
                        members[j].push(initial[data[i+j]].leadership)
                        names[j].push(initial[data[i+j]].id)
                    } else {
                        members[j].push(0)
                        names[j].push("")
                    }
                }
                members[groupSize].push(groupHates(data, i))
                names[groupSize].push("")
            }
            return {members: members, names: names};     
        },
        loadExternal: function(groups) {
            groups.sort(compareByGroupSize) 
            for (var i=0, j=0; i<groups.length; i++) {
                for (var k=0; k<groups[i].length; k++) {
                    this.data[j++] = students[groups[i][k]].index
                }
            }
            this.evaluate(this.data)
            return this
        },
        evaluate: function(data) {          
            var groups = [];
            for (var i=0; i<initial.length; i+=groupSize) {
                var group = []
                for (var j=0; j<groupSize && i+j<initial.length; j++) {
                    group.push(data[i+j])
                }
                groups.push(group)
            }
            groups.sort(compareByGroupLeadership)            
            for (i=0, j=0; i<groups.length; i++) {
                // canonicalize group
                groups[i].sort(compareByLeadership)
                // copy back to original array
                for (var k=0; k<groups[i].length; k++) {
                    data[j++] = groups[i][k]
                }
            }
            var bad = 0            
            for (i=0; i<initial.length; i+=groupSize) {           
                // calculate badness
                bad += leadershipWeight * groupLeadershipDelta2(data, i) 
                    + (1 - leadershipWeight) * groupHates(data, i);
            }  
            return bad / i
        },
        copyData: function(data) {
            return data.slice(0)
        },
        mutate: function(data) {
            var n = Math.floor(jv.random() * initial.length * .5) + 5
            for (var i=0; i<n; i++) {
                var a = jv.random() * initial.length
                var b = jv.random() * initial.length
                jv.swap(data, a, b)
            }
        },
        initialize: function() {
            var data = []
            for (var i=0; i<initial.length; i++) data[i] = i
            if (jv.random()<.25) {
                var sorted = data.slice(0).sort(compareByLeadership);                
                for (var j=0, p=0; j<initial.length; j++) {
                    data[p] = sorted[j];
                    p=(p+groupSize%initial.length)
                }
            } else {               
                jv.shuffle(data)
            }
            return data
        },
        crossover: function(data, other) {
            var da=data, db=other;
            var d1 = [], d2 = []
            xo(da, db, d1, d2, 0, initial.length)
            var c1 = new AChromosome(d1)
            var c2 = new AChromosome(d2)
            if (jv.isDebug()) {
                jv.debug("A:  " + this.pretty(da))
                jv.debug("B:  " + this.pretty(db))
                jv.debug("C1: " + c1.dump())
                jv.debug("C2: " + c2.dump())
            }
            return [new AChromosome(d1), new AChromosome(d2)];
        }
    })
    
    // XO crossover operator
    function xo(da, db, c1, c2, offset, n) {
        var s1 = {}, s2 = {}
        var r = jv.random() * n
        var j, k
        for (var i=0; i<n; i++) {
            if (i<r) {
                c1.push(da[offset+i])
                s1[da[offset+i]] = true
                c2.push(db[offset+i])
                s2[db[offset+i]] = true
            } else {
                for (j=0; j<n; j++) {
                    k = (db[offset+i]+j)%n
                    if ( ! s1[k]) { s1[k] = true; c1.push(k); break; }
                }
                for (j=0; j<n; j++) {
                    k = (da[offset+i]+j)%n
                    if ( ! s2[k]) { s2[k] = true; c2.push(k); break; }
                }
            }
        }
    }

    // ga using this chromosome with several custom fields
    var ga = new jv.GA({
        plotOffset: 0,
        chromosome: AChromosome,
        maxIterations: Math.max(1, Math.floor(generations / splits)),
        populationCount: popSize,
        mutationRate: .3,
        selectParents: jv.Selections.roulette,
        refineFitness: jv.Refinements.createNormalizer(.1, true),
        reset: function() {
            // used to gather plot data for convergence plots
            this.plotData = []
        },
        finished: function() {
            if (this.iterations%1000 == 0) {
                jv.info("...Generation " 
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
    ga.populate()
    return ga
}

// plots "nucleo" assignments
function plotBest(w, h, data, canvasId) { 
    var bWidth = 20
    var bMargin = 5
    
    var maxY = pv.max(data.members.reduce(function(a, b) {return a.concat(b)}))
    var y = pv.Scale.linear(0, maxY).range(0, h/data.members.length);
    
    var vis = new pv.Panel()
        .canvas(canvasId)
        .width(w)
        .height(h)
        .margin(20)
        .right(40)
        .left(40);

    vis.add(pv.Rule)
        .data(pv.range(data.members[0].length-1))
        .left(function() { return this.index*bWidth + 2*bMargin})
        .strokeStyle("white")
      .anchor("bottom").add(pv.Label)
        .text(function() {return this.index+1});

    vis.add(pv.Layout.Stack)
        .layers(data.members)
        .x(function() { return this.index * bWidth})
        .y(function(d) { return y(d)})
      .layer.add(pv.Area).interpolate("step-after");    

    vis.add(pv.Bar)
        .data(pv.range(data.members[0].length-1))
        .left(function() { return this.index*bWidth})
        .bottom(0)
        .height(400)
        .width(bMargin)
        .strokeStyle("white")
        .fillStyle("white") 

    vis.render();
}