(function () {
    "use strict";
    // Gem size constant in pixels
    var GEMSIZE = 48;

    // Margin top equal to 1 gems height
    var MARGINTOP = 0;
    
    // All gem types
    var GEMTYPES = ["niv1", "niv2", "niv3", "niv4", "niv5", "niv6", "niv7", "niv8", "niv9", "niv10", "niv11", "niv12"];
    
    // Game class
    function Game(stage) {
        
        this.score = 0;
        this.addToScore(0);
        
        this.stage = stage;

        // Create a new jMatch3 Grid
        this.grid = new jMatch3.Grid({
            width: 6,
            height: 9,
            gravity: "down"
        });
        
        this.discoveredGems = [GEMTYPES[0], GEMTYPES[1], GEMTYPES[2]];
        
        // Create new Gem
        var currentGemGroup;
        var nextGemGroup;

        this.showNextGroup = function() {
            document.getElementById("gem1").style.backgroundImage = 'url("assets/'+nextGemGroup.getGemType(0)+'.png")';
            document.getElementById("gem2").style.backgroundImage = 'url("assets/'+nextGemGroup.getGemType(1)+'.png")';
        }
        
        this.newGemGroup = function () {
            currentGemGroup = nextGemGroup;
            nextGemGroup = new GemGroup(this);  
            this.showNextGroup();
            if (currentGemGroup && currentGemGroup.addToStage){
                currentGemGroup.addToStage();
            }
            this.updateScore();
        };

        this.newGemGroup();
        this.newGemGroup();

        // Bind a function to each keys
        var keys = {
            left: function() {
                if (currentGemGroup) {
                    currentGemGroup.move(-1);
                }
            },
            right: function() {
                if (currentGemGroup) {
                    currentGemGroup.move(1);
                }
            },
            up: function() {
                if(currentGemGroup) {
                    currentGemGroup.rotate();
                }
            },
            down: function() {
                if (currentGemGroup) {
                    currentGemGroup.drop();
                    currentGemGroup = false;
                }
            }
        };
        
        // Handle keys
        this.handleKeyPressed = function(key) {
            keys[key]();
        };
    }
    
    Game.prototype.handleMatches = function () {
        
        // Get all matches
        var matches = this.grid.getMatches();
        var b_matches=false;

        // If matches have been found
        if (matches) {
                
            // Initialize the array of pieces to upgrade
            var piecesToUpgrade = [];
            
            // Reference to the current game
            var game = this;
            
            // For each match found
            this.grid.forEachMatch(function(matchingPieces, type) {
                if (GEMTYPES.indexOf(type)<(GEMTYPES.length-2)){                  
                  // For each match take the first piece to upgrade it
                  piecesToUpgrade.push({
                      piece: matchingPieces[0],
                      type: type
                  });
                  
                  for (var i in matchingPieces) {
                      var gem = matchingPieces[i].object;
                      
                      // Remove gem bitmap from stage
                      gem.game.stage.removeChild(gem.bitmap);
                  }
                }                
            });
            
            if (piecesToUpgrade.length>0){
                // des pièces ont été modifiées
                b_matches=true;
                
                // Remove matches and apply Gravity
                this.grid.clearMatches(function(piece){ return piece.object.type!==GEMTYPES[GEMTYPES.length-1];});
                
                // Upgrade pieces
                this.handleUpgrade(piecesToUpgrade);
            }
        }
        
        this.handleFalling(b_matches);
    };
    
    Game.prototype.handleFalling = function(lastmatches) {
        
        // Apply gravity and get falling Pieces
        var fallingPieces = this.grid.applyGravity();
        
        if (fallingPieces.length > 0) {
            // Falling counter
            var hasFall = 0;

            // For each falling pieces
            for (var i in fallingPieces) {

                var piece = fallingPieces[i];
                
                // Reference to current game
                var game = this;
                
                // Make gem fall
                piece.object.fall(piece.x, piece.y, function() {
                    hasFall += 1
                    if (hasFall === fallingPieces.length) {
                        game.handleMatches();
                    }
                });

            }
        } else {
            if (lastmatches){
              // Reference to current game
              var game = this;
              game.handleMatches();
            }else{                            
                if (this.existGemInRow(0) || this.existGemInRow(1)) {
                  this.stage.removeAllChildren();                  
                  gameOver();
                }else{              
                    this.newGemGroup();                       
                }
            }
        }

    };
    
    Game.prototype.existGemInRow = function(numRow){
        var voidObject = {
                  type: "empty"
              };
        var exist = false;
        var row = this.grid.getRow(numRow,false);
          for (var j in row) {
            if (row[j].object.type !== voidObject.type) {
              exist = true;
            }
          }
        return exist;        
    }
    
    Game.prototype.handleUpgrade = function(piecesToUpgrade) {
        
        // For each piece to upgrade
        for (var i in piecesToUpgrade) {
            
            // Get the piece
            var pieceToUpgrade = piecesToUpgrade[i];
            
            // Get the upgraded type
            var upgradedType = GEMTYPES[GEMTYPES.indexOf(pieceToUpgrade.type) + 1];
            
            // If the type is defined
            if (typeof upgradedType !== "undefined") {
                
                // And if the type is not already discovered
                if (this.discoveredGems.indexOf(upgradedType) === -1) {
                    
                    // Push it to discovered gems array
                    this.discoveredGems.push(upgradedType);
                }
                
                // And create a new piece
                pieceToUpgrade.piece.object = new Gem(this, upgradedType, pieceToUpgrade.piece.x, pieceToUpgrade.piece.y + MARGINTOP);
                pieceToUpgrade.piece.object.addToStage();
            }

        }
    };
    
    Game.prototype.randomGemType = function() {
        return this.discoveredGems[Math.floor(Math.random() * (this.discoveredGems.length-1))];
    };
    
    Game.prototype.addToScore = function(amount) {
        this.score += amount;
        document.getElementById("score").innerHTML = this.score;
    };
    
    Game.prototype.updateScore = function(){
        var voidObject = {
            type: "empty"
        };
        this.score=0;
        for (var y = 0; y < this.grid.height; y++) {
            for (var x = 0; x < this.grid.width; x++) {
                if (this.grid.pieces[x][y].object.type!==voidObject.type){
                    this.addToScore(
                        Math.pow(3,GEMTYPES.indexOf(
                            this.grid.pieces[x][y].object.type))
                        );
                }
            };
        };
    }
    
    // GemGroup class
    function GemGroup(game) {
        
        var x = 0;
        
        // Define patterns
        var patterns = [{
            first: { x: 0, y: 0 },
            second: { x: 0, y: 1 },
            order: ['second', 'first']
        }, {
            first: { x: 1, y: 1 },
            second: { x: 0, y: 1 },
            order: ['second', 'first']
        }, {
            first: { x: 0, y: 1 },
            second: { x: 0, y: 0 },
            order: ['first', 'second']
        }, {
            first: { x: 0, y: 1 },
            second: { x: 1, y: 1 },
            order: ['first', 'second']
        }];
        
        var currentPattern = 0;
        
        // Create 2 gems
        var gems = {
            first: new Gem(game, game.randomGemType(), x + patterns[currentPattern].first.x, patterns[currentPattern].first.y),
            second: new Gem(game, game.randomGemType(), x + patterns[currentPattern].second.x, patterns[currentPattern].second.y)
        };
        
        this.updatePositions = function () {
            var pattern = patterns[currentPattern];
            gems.first.move(x + pattern.first.x, pattern.first.y);
            gems.second.move(x + pattern.second.x, pattern.second.y);
        }
        
        this.drop = function() {
            // Get the pattern
            var pattern = patterns[currentPattern];
            
            // Drop counter
            var dropped = 0;
            
            // Gems to drop
            var gemsCount = pattern.order.length;
            
            // Drop gems in order
            for (var i in pattern.order) {
                gems[pattern.order[i]].drop(function() {
                    dropped += 1;
                    
                    // If all gems have been dropped
                    if (dropped === gemsCount) {
                        game.handleMatches();
                    }
                    
                });
            }
        };
        
        this.addToStage = function(){
            gems.first.addToStage();   
            gems.second.addToStage();   
        }
        
        this.getGemType = function(numGem){
            if (numGem===0){
                return gems.first.type;
            }else{
                return gems.second.type;
            }
        }
        
        this.move = function(amount) {
            
            // new x position
            var newX = x + amount;
            
            // if current pattern is 1 or 3 max x is 4
            var maxX = (currentPattern === 1 || currentPattern === 3) ? 4 : 5;
            
            // if x is >= to 0 and <0 maxX
            if (newX >= 0 && newX <= maxX) {
                // we can update x
                x = newX;
            }
            
            // Update positions
            this.updatePositions();
        };
        
        this.rotate = function() {
            
            // Update the current pattern
            currentPattern = (currentPattern + 1) % patterns.length;
            
            // If x is 5 and current pattern is 1 or 3
            if (x === 5 && (currentPattern === 1 || currentPattern === 3)) {
                // We must set x to 4
                x = 4;
            }
            
            // Update positions
            this.updatePositions();
        };
    
    }
    
    // Gem class
    function Gem(game, type, x, y) {
        this.game = game; // game reference
        this.type = type;

        // Create new bitmap
        this.bitmap = new createjs.Bitmap("assets/" + type + ".png");

        this.move(x, y);
    }
    
    Gem.prototype.addToStage = function(){
        // Add it to game stage
        this.game.stage.addChild(this.bitmap);        
    }
    
    // Move method
    Gem.prototype.move = function(x, y) {
        this.x = x;
        this.y = y;
        this.bitmap.x = this.x * GEMSIZE;
        this.bitmap.y = this.y * GEMSIZE;
    };

    // Drop method
    Gem.prototype.drop = function(callback) {
        
        // Get the gem column
        var column = this.game.grid.getColumn(this.x);
        
        // Get the last empty piece to place the gem
        var lastEmpty = jMatch3.Grid.getLastEmptyPiece(column);

        // If an empty piece has been found
        if (lastEmpty) {
            
            // Bind this gem to the piece
            lastEmpty.object = this;

            // And make it fall
            this.fall(lastEmpty.x, lastEmpty.y, callback);

            lastEmpty = jMatch3.Grid.getLastEmptyPiece(column);
        } else {
            // Remove all bitmap
            this.game.stage.removeAllChildren();
            
            // Game Over
            gameOver();
            
        }
    }

    // Fall method
    Gem.prototype.fall = function(x, y, callback) {
        
        callback = callback || function() {};

        // Create a tween animation
        createjs.Tween.get(this.bitmap).to({
            x: x * GEMSIZE,
            // End x position
            y: MARGINTOP * GEMSIZE + y * GEMSIZE // End y position
        }, 500, createjs.Ease.cubicOut).call(callback);

    };

    window.initialize = function() {

        // Create new stage on the canvas
        var stage = new createjs.Stage(document.getElementById("match_3"));

        // Create a ticker
        createjs.Ticker.addEventListener("tick", function(event) {
            stage.update(event);
        });
        
        var game;
        
        var preload = new createjs.LoadQueue();
        preload.addEventListener("complete", function() {
            game = new Game(stage);
        });
        
        preload.loadManifest([
            "assets/niv1.png",
            "assets/niv2.png",
            "assets/niv3.png",
            "assets/niv4.png",
            "assets/niv5.png",
            "assets/niv6.png",
            "assets/niv7.png",
            "assets/niv8.png"
        ]);
        
        // Global game over function
        window.gameOver = function() {
            alert("Game Over - Your score : "+ game.score);
            game = new Game(stage);
        }
        
        key('left', function() {
            game.handleKeyPressed('left');
        });

        key('right', function() {
            game.handleKeyPressed('right');
        });

        key('down', function() {
            game.handleKeyPressed('down');
        });

        key('up', function() {
            game.handleKeyPressed('up');
        });

    };

})();
