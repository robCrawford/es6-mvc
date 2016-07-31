import * as app from "../../js/lib/app";

describe("Object util tests", function(){

    describe("setNode", function(){

        var setNode = app.setNode;

        it("Should add a new property", function(){
            var tree = {a:1, b:2};
            setNode(tree, "h", 77);

            expect(tree).toEqual({a:1, b:2, h:77});
        });

        it("Should add a property at a new path", function(){
            var tree = {a:1, b:2};
            setNode(tree, "h.j", 77);

            expect(tree).toEqual({a:1, b:2, h: {j: 77}});
        });

        it("Should add a property at a new deep path", function(){
            var tree = {a:1, b:2};
            setNode(tree, "h.j.k.l", 77);

            expect(tree).toEqual({a:1, b:2, h: {j: {k: {l: 77}}}});
        });

        it("Should add a property at a partial deep path", function(){
            var tree = {a: {b: {c: {d: 77}}}};
            setNode(tree, "a.b", 77);

            expect(tree).toEqual({a: {b:77}});
        });

        it("Should add a new numerical property at root", function(){
            var tree = {a:1, b:2};
            setNode(tree, "2", 77);

            expect(tree).toEqual({a:1, b:2, "2":77});
        });

        it("Should add an array at a numerical path", function(){
            var tree = {a:1, b:2};
            setNode(tree, "c.2", 77);

            //Stringify to allow child object comparison
            expect(JSON.stringify(tree)).toEqual(
                JSON.stringify({a:1, b:2, c:[undefined, undefined, 77]})
            );
        });

        it("Should add an array at a deep numerical path", function(){
            var tree = {a:1, b:2};
            setNode(tree, "c.2.a.1.2", 77);

            //Stringify to allow child object comparison
            expect(JSON.stringify(tree)).toEqual(
                JSON.stringify({a:1, b:2, c:[undefined, undefined, {a: [undefined, [undefined, undefined, 77]]}]})
            );
        });

    });

    describe("getNode", function(){

        var getNode = app.getNode;

        it("Should get a property value", function(){
            var tree = {a:1, b:2};
            expect(getNode(tree, "a")).toBe(1);
        });

        it("Should get a deep property value", function(){
            var tree = {a:{b:{c:77}}, b:2};
            expect(getNode(tree, "a.b.c")).toBe(77);
        });

        it("Should get a property containing a numerical index", function(){
            var tree = {a:{b:[{c: 77}]}, b:2};
            expect(getNode(tree, "a.b.0.c")).toBe(77);
        });

        it("Should return undefined for an invalid path", function(){
            var tree = {a:{b:[{c: 77}]}, b:2};
            expect(getNode(tree, "a.b.7.c.5.6")).toBe(undefined);
        });

        it("Should allow falsy values in path", function(){
            var tree = {0:{0:[{0: 0}]}};
            expect(getNode(tree, "0.0.0.0")).toBe(0);
        });

    });

    describe("merge", function(){

        var merge = app.merge;

        it("Should add object properties", function(){
            var tree = {a:1, b:[2, 3]},
                tree2 = {c:3, d:4},
                tree3 = {e:5, f:6};
            expect(merge(tree, tree2, tree3)).toEqual({a:1, b:[2, 3], c:3, d:4, e:5, f:6});

            //Edge cases
            expect(merge()).toEqual({});
            expect(merge(tree)).toBe(tree);
            expect(merge("23")).toEqual({});
            expect(merge("23", "34")).toEqual({});
            expect(merge({2: "5"}, "34")).toEqual({0: "3", 1: "4", 2:"5"});
        });

        it("Should overwrite properties right to left", function(){
            var tree = {a:1, b:[2, 3]},
                tree2 = {c:3, b:[4]},
                tree3 = {a:5, d:6};
            expect(merge(tree, tree2, tree3)).toEqual({a:5, b:[4], c:3, d:6});
        });

        it("Should merge child objects right to left", function(){
            var tree = {a: {a:1, b:[2, 3]}},
                tree2 = {a: {c:3, b:[4]}},
                tree3 = {a: {a:5, d:6}};
            expect(merge(tree, tree2, tree3)).toEqual({a: {a:5, b:[4], c:3, d:6}});
        });

        it("Should merge deep child objects right to left", function(){
            var tree = {a: {a: [7, 8], b:{c:{d:{e:77}}}}},
                tree2 = {a: {a:1, b:{c:{d:{e:88}}}}},
                tree3 = {a: {a: [6]}};
            expect(merge(tree, tree2, tree3)).toEqual({a: {a:[6], b:{c:{d:{e:88}}}}});
        });

        it("Should not merge child objects when boolean false is passed in", function(){
            var refOb = {aa:1, bb:2},
                tree = {a:1, b:2, c:{}},
                tree2 = {c: refOb};
            // Boolean is `mergeChildObs`
            var result = merge(false, tree, tree2);
            expect(result.c).toBe(refOb);
            expect(result).toEqual({a: 1, b:2, c:{aa:1, bb:2}});
        });

        it("Should switch on and off merging child objects when booleans are passed in", function(done){
            var refOb = {aa:1, bb:2},
                tree = {a:1, b:2, c:{}},
                tree2 = {c: refOb},
                tree3 = {d: refOb},
                tree4 = {e: refOb};
            // Boolean switches `mergeChildObs` (also test multiple unused arguments, and callback argument)
            var result = merge(true, true, false, false, tree, tree2, true, false, done, true, tree3, false, tree4, true);
            expect(result.c).toBe(refOb);
            expect(result.d).not.toBe(refOb);
            expect(result.e).toBe(refOb);
            expect(result).toEqual({a: 1, b:2, c:{aa:1, bb:2}, d:{aa:1, bb:2}, e:{aa:1, bb:2}});
        });

        it("Should ignore arguments of wrong type", function(){
            var tree = {a: {a: 1, b:[2, 3]}},
                tree2 = {a: {b: 6}};
            expect(merge("", "", "", "", tree, tree2)).toEqual({a: {a: 1, b:6}});

            tree = {a:1, b:[2, 3]};
            expect(merge("", 99, tree, "", 88)).toEqual(tree);
            expect(merge(tree, 99, "", "", "")).toEqual(tree);
            expect(merge(99, tree, "", 88, 77)).toEqual(tree);
        });

        it("Should report changes", function(){
            var tree = {a: {a:1, b:[2, 3]}},
                tree2 = {a: {c:3, b:[4]}},
                tree3 = {a: {a: [6]}};

            merge(tree, tree2, function(isChanged){
                expect(isChanged).toBe(true);
            });

            merge(tree, tree, function(isChanged){
                expect(isChanged).toBe(false);
            });

            merge(tree, function(){}, function(isChanged){
                expect(isChanged).toBe(false);
            });

            merge("", tree, tree3, function(isChanged){
                expect(isChanged).toBe(true);
            });

            merge({z: 88}, tree, function(isChanged){
                expect(isChanged).toBe(true);
            });

            merge({z: {y: {x: 55}}}, {z: {y: {x: 56}}}, function(isChanged){
                expect(isChanged).toBe(true);
            });
        });

    });

});

