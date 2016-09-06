import Boot from "../../js/modules/Boot/Boot";

describe("Boot module", function(){

    it("should be defined", function(){
        let boot = new Boot();
        expect(boot.then).toBeDefined();
    });

});
