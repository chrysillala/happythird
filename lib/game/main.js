ig.module( 
	'game.main' 
)

.requires(
	'impact.game',
	'game.levels.dorm1',
	'game.levels.dorm2',
	'game.levels.dorm3',
	'impact.font', //import the font 
	'impact.timer',
	'impact.debug.debug'
)

.defines(function(){

	MyGame = ig.Game.extend({
		
		gravity: 300,

		//adding text to the game (for instruction)
		instructText: new ig.Font('media/04b03.font.png'),

		//text for player stats
		statText: new ig.Font('media/04b03.font.png'),
		showStats: false,
		statMatte: new ig.Image('media/stat-matte.png'),
		levelTimer: new ig.Timer(),
		levelExit: null,
		stats: {time:0, kills:0, deaths: 0},

		
		init: function() {
			
			//tell the game to load the level
			this.loadLevel(LevelDorm1);

			//keys binding untuk atur control di game
			//dengan cara capture keyboard input/event
			ig.input.bind(ig.KEY.LEFT_ARROW, 'left');
			ig.input.bind(ig.KEY.RIGHT_ARROW, 'right');
			ig.input.bind(ig.KEY.X,'jump');
			ig.input.bind(ig.KEY.C, 'shoot');
			ig.input.bind(ig.KEY.TAB, 'switch');
			ig.input.bind(ig.KEY.SPACE, 'continue');
			

			//add background music
			ig.music.add('media/sounds/theme.*');
			ig.music.volume = 0.5;
			ig.music.play();

		},

		//override loadLevel() method so we can start the timer
		//to track how long it takes to complete the level
		loadLevel: function(data){
			this.parent(data);
			this.levelTimer.reset(); //reset the timer when main game class load a new level
			//reset the player stat when a new level is loaded
			this.stats = {time: 0, kills: 0, deaths: 0};
		},

		//toggle the stat screen
		toggleStats: function(levelExit){
			this.showStats = true;
			this.stats.time = Math.round(this.levelTimer.delta());
			this.levelExit = levelExit;

		},
		
		update: function() {
			
			// Add your own, additional update code here
			//screen follows player
			var player = this.getEntitiesByType(EntityPlayer)[0];
			if(player){
				//nilai yg dibagi ig.system.width jika makin besar screen terlihat semakin ke kanan
				//untuk height, makin besar nilai screen semakin ke atas
				//jika nilai ny <1 maka error
				this.screen.x = player.pos.x - ig.system.width/2;
				this.screen.y = player.pos.y - ig.system.height/2;
				
				//test if the player acceleration increases, which happens when the player moves
				//jika player bergerak dan font instance exists, set menjadi null
				if(player.accel.x > 0 && this.instructText)
					this.instructText = null;
			}

			// Update all entities and backgroundMaps
			//in order to display the our screen, we have to pause the update loop
			//if the stats screen not being displayed, call this.parent()
			//game runs like normal
			if(!this.showStats){ 
				this.parent();
			//if visible, delay the call to this.parent() and listen for an input state of continue
			}else{
				if(ig.input.state('continue')){
					this.showStats = false;
					this.levelExit.nextLevel();
					this.parent();
				}
			}
			
		},
		
		draw: function() {
			// Draw all entities and backgroundMaps
			this.parent();
			
			//make sure the font exists before trying to render it
			//yaitu ketika player sudah bergerak, instructTest = null maka draw loop akan ignore untuk render font tsb
			if(this.instructText){
				var x = ig.system.width/2,
				y = ig.system.height - 10;
				this.instructText.draw('Left/Right: Moves, X: Jumps, C: Fires & Tab: Switches Weapons.', 
					x, y, ig.Font.ALIGN.CENTER);
			}

			if(this.showStats){
				this.statMatte.draw(0,0);
				var x = ig.system.width/2;
				var y = ig.system.height/2 - 20;
				this.statText.draw('Level Complete', x, y, ig.Font.ALIGN.CENTER);
				this.statText.draw('Time: ' +  this.stats.time, x, y+30, ig.Font.ALIGN.CENTER);
				this.statText.draw('Kills: ' +  this.stats.kills, x, y+40, ig.Font.ALIGN.CENTER);
				this.statText.draw('Deaths: ' +  this.stats.deaths, x, y+50, ig.Font.ALIGN.CENTER);
				this.statText.draw('Press SPACE to continue', x, ig.system.height-10, ig.Font.ALIGN.CENTER);
			}
			
			//cari fungsi dari code ini, kelupaan >< karena d resource yang dikasi bagian ini dihapus
			//tapi pas dicoba run dengan code ini ga masalah
			/*
			var x = ig.system.width/2,
			y = ig.system.height/2;
			*/
			//Answer --> untuk posisi x,y pada intructText
			
		}

		
	});

	//creating start screen
	StartScreen = ig.Game.extend({
		instructText: new ig.Font('media/04b03.font.png'),
		background: new ig.Image('media/screen-bg.png'),

		mainCharacter: new ig.Image('media/screen-main-character.png'),
		title: new ig.Image('media/game-title.png'),
		
		//bind the space key
		init: function(){
			ig.input.bind(ig.KEY.SPACE, 'start');
		},

		//override the method to handle space bar being presed
		//then tell the ig.system to load MyGame class
		update: function(){
			if(ig.input.pressed('start')){
				ig.system.setGame(MyGame)
			}
			this.parent();
		},

		draw: function(){
			this.parent();
			this.background.draw(0,0);
			this.mainCharacter.draw(0,0);
			this.title.draw(ig.system.width - this.title.width, 15);
			var x = ig.system.width/2,
			y = ig.system.height - 10;
			this.instructText.draw('Press SPACEBAR to start the game',
				x+50, y, ig.Font.ALIGN.CENTER);
		}

	});

	if(ig.ua.mobile){
		//disable sound for all mobile devices
		ig.Sound.enabled = false;
	}


	// Start the Game with 60fps, a resolution of 320x240, scaled
	// up by a factor of 2
	//pass the ID of the canvas element to game's constructor
	ig.main( '#canvas', StartScreen, 60, 320, 240, 2 );

});
