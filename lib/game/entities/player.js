//player class extends ig.Entity

ig.module(
	//di declare supaya bisa digunakan saat memilih entities di weltmeister
	'game.entities.player'
)
.requires(
	'impact.entity',
	'impact.sound'
)
.defines(function(){

	EntityPlayer = ig.Entity.extend({

		// bikin animation sheet
		// player.png akan digunakan, tiles nya 16*16
		animSheet: new ig.AnimationSheet('media/player.png', 16, 16),
		size: {x: 8, y: 14}, //represent actual size of player
		//any change in the player size needed to make collision more accurate
		//offsetting the bounding box by 4 px on left and right
		//by 2 px on top and bottom
		offset: {x:4, y:2}, 
		flip: false, //renmains oriented in original direction


		//*** physics!
		//defines how the player can move in the environment
		//Impact handles all the physics calculation
		maxVel: {x:100, y:150},
		friction: {x:600, y:0}, //gesekan 
		accelGround: 400, //percepatan di ground
		accelAir: 200, //percepatan di udara setelah jump
		jump: 200, //seberapa jauh lompatan keatas


		type: ig.Entity.TYPE.A, //type A untuk player, represent the friendly group
		checkAgainst: ig.Entity.TYPE.NONE, //di kasus ini, we'll let the monster handles the collisions
		collides: ig.Entity.COLLIDES.PASSIVE,  //untuk mencegah overlap dengan PASSIVE entity lain nya


		health: 200,


		//keep track of the current weapon
		weapon: 0,
		totalWeapons: 2,
		//set the value to string instead of reference to the class itself
		//this will be evaluated correctly when the player class gets created
		//if not string, it will break the player class when it tries to load
		activeWeapon: "EntityBullet",

		//when respawning the player
		startPosition: null,
		invincible: true,
		invincibleDelay: 2,
		invincibleTimer: null,

		//show the player at weltmeister
		//because we already set the player invicible when he is created
		_wmDrawBox: true,
		_wmBoxColor: 'rgba(255,0,0,0.7)',


		//Adding sound
		jumpSFX: new ig.Sound('media/sounds/jump.*'),
		shootSFX: new ig.Sound('media/sounds/shoot.*'),
		deathSFX: new ig.Sound('media/sounds/death.*'),


		//*** setting up animation sequences
		//constructor of player entity
		init: function(x, y, settings){

			//pass the x, y, settings value to parent's init() method
			//entities perlu tau start x,y position dan settings yang diassign saat level ny d bentuk
			this.parent(x, y, settings);
			/*
			//set up animation for player (not include switching weapons)
			this.addAnim('idle', 1, [0]);
			this.addAnim('run', 0.07, [0,1,2,3,4,5]);
			this.addAnim('jump', 1, [9]);
			this.addAnim('fall', 0.4, [6,7]);
			*/
			//set up animation when switching weapons
			this.setupAnimation(this.weapon);

			//respawn the plaer by storing the initial position
			this.startPosition = {x:x,y:y};

			this.invincibleTimer = new ig.Timer();
			this.makeInvincible();

		},


		setupAnimation: function(offset){
			//takes the current weapon ID as offset
			//10 sprites holding gun and 10 sprites without
			//offsetting the animation by 10 frames to easily switch between different sets of sprites
			offset = offset*10;
			this.addAnim('idle', 1, [0+offset]);
			this.addAnim('run', .07, [0+offset,1+offset,2+offset,3+offset,4+offset,5+offset]);
			this.addAnim('jump', 1, [9+offset]);
			this.addAnim('fall', 0.4, [6+offset,7+offset]);

		}, //END setupAnimation


		makeInvincible: function(){
			this.invincible = true;
			this.invincibleTimer.reset();
		
		}, //END makeInvincible


		update: function(){
			//move left or right
			var accel = this.standing ? this.accelGround : this.accelAir;
			if(ig.input.state('left')){
				this.accel.x = -accel;
				this.flip = true;
			} else if (ig.input.state('right')) {
				this.accel.x = accel;
				this.flip = false;
			} else {
				this.accel.x = 0;
			}

			//jump
			if(this.standing && ig.input.pressed('jump')){
				this.vel.y = -this.jump;
				//add jumpsfx
				this.jumpSFX.volume = 0.5;
				this.jumpSFX.play();

			}

			//shoot
			//use spawnEntity() to create new instance of the bullet
			//this function helps ensure that when we create a new entity, it gets added to impact's render list
			if(ig.input.pressed('shoot')){
				//ig.game.spawnEntity(EntityBullet, this.pos.x, this.pos.y, {flip:this.flip});
				ig.game.spawnEntity(this.activeWeapon, this.pos.x, this.pos.y, {flip:this.flip});
				//add shootsfx
				this.shootSFX.play();
			}	
			if(ig.input.pressed('switch')){
				this.weapon++;
				if(this.weapon >= this.totalWeapons)
					this.weapon = 0;
				switch(this.weapon){
					case(0):
						this.activeWeapon = "EntityBullet";
						break;
					case(1):
						this.activeWeapon = "EntityGrenade";
					break;
				}
				this.setupAnimation(this.weapon);
			}

			//set the current animation, based on the player speed
			//such as jump, fall, idle and run
			if(this.vel.y < 0){
				this.currentAnim = this.anims.jump;
			} else if(this.vel.y > 0){
				this.currentAnim = this.anims.fall;
			} else if(this.vel.x != 0){
				this.currentAnim = this.anims.run;
			} else {
				this.currentAnim = this.anims.idle;
			}

			//flip player animation based on the direction he is running
			this.currentAnim.flip.x = this.flip;

			//if timer is greater than delay, disable the invincibility
			//then force the alpha value to be 1
			if(this.invincibleTimer.delta() > this.invincibleDelay){
				this.invincible = false;
				this.currentAnim.alpha = 1;
			}

			//move
			this.parent();

		}, //END update


		//when the player die
		kill: function(){
			//add death value by 1 to player stat each time the player die
			ig.game.stats.deaths++;
			//add deathSFX
			this.deathSFX.play();
			//override kill() method
			//method kill() dipanggil ketika player bertabrakan dengan monster
			this.parent(); //remove the player instance from the game
			//add the death animation where the player was killed
			//then immediately spawn a new player at the saved position
			var x = this.startPosition.x;
			var y = this.startPosition.y;
			ig.game.spawnEntity(EntityDeathExplosion, this.pos.x, this.pos.y,
				{callback:function(){ig.game.spawnEntity(EntityPlayer, x, y)}});
		
		}, //END kill


		receiveDamage: function(amount, from){
			if(this.invincible)
				return; //if true, exit the method and dont apply any damage
			this.parent(amount, from);
			
		}, // END receiveDamage


		draw: function(){
			if(this.invincible)
				this.currentAnim.alpha = this.invincibleTimer.delta()/this.invincibleDelay * 1;
			this.parent();
			
		} // END draw

	}); //END EntityPlayer

	
	//*** Weapon Entity inner class
	//pada game ini weapon entity, EntityBullet, dibuat dalam player.js 
	//karena weapon ini akan digunakan throughout the game
	EntityBullet = ig.Entity.extend({

		size: {x: 5, y: 3},
		animSheet: new ig.AnimationSheet('media/bullet.png', 5, 3),
		//bullet only move horizontal, makanya y nilainya 0
		//mak sure bullet move faster than the player
		maxVel: {x: 200, y: 0},


		type: ig.Entity.TYPE.NONE,
		checkAgainst: ig.Entity.TYPE.B,
		collides: ig.Entity.COLLIDES.PASSIVE,



		//this function ensure the bullet starts in the correct position and appears to be fired from the gun
		//by taking the flip value that will be passed to EntityBullet via optional settings object
		init: function(x, y, settings){
			this.parent(x+(settings.flip?-4:8), y+8, settings);
			//set velocity and accel to maximum x value (which is x:200)
			//kalo player menghadap ke kiri, value menjadi negatif
			//supaya bullet ny ke force untuk fire at its max 
			//instead of bullet ny accelerate perlahan to its max velocity
			this.vel.x = this.accel.x = (settings.flip ? -this.maxVel.x : this.maxVel.x);
			this.addAnim('idle', 0.2, [0]);
		},

		//untuk test saat bullet collide dgn sesuatu pada collision layer
		//function ini dipanggil saat entity bergerak, this method also associated with the collision map
		//untuk detect saat bullet ny hit the wall
		handleMovementTrace: function(res){
			this.parent(res);
			//check the res object parameter if a collision happens on x or y values
			if(res.collision.x || res.collision.y){
				this.kill();
			}
		},

		//damage yg di receive saat monster kena bullet
		check: function(other){
			other.receiveDamage(3, this);
			this.kill();
		}

	}); //END EntityBullet

	
	//time to add more weapon!
	EntityGrenade = ig.Entity.extend({
		size: {x:4, y:4},
		//grenade need offset because ?? (explained below)
		offset: {x:2 ,y:2}, 
		animSheet: new ig.AnimationSheet('media/grenade.png', 8, 8),

		//collision detection
		type: ig.Entity.TYPE.NONE,
		checkAgainst: ig.Entity.TYPE.BOTH, //can collide with player and monsters
		collide: ig.Entity.COLLIDES.PASSIVE,

		maxVel: {x: 200, y: 200},
		bounciness: 0.6, 
		bounceCounter: 0, //how many times it will bounce before blow up
	

		init: function(x, y, settings){
			this.parent(x+(settings.flip?-4:7), y, settings);
			//determine the beginning x velocity
			//x, y offset value is important because grenade can collide with player
			//we dont want the player to fire the weapon then instantly blow up
			this.vel.x = (settings.flip ? -this.maxVel.x : this.maxVel.x);
			//arc the grenade randomly when it gets fired
			this.vel.y = -(50+(Math.random()*100));
			this.addAnim('idle', 0.2, [0,1]);
		},

		handleMovementTrace: function(res){
			this.parent(res);
			if(res.collision.x || res.collision.y){ //detect collisions
				this.bounceCounter++; //track the number of bounce
				if(this.bounceCounter > 3){
					this.kill(); //bounce more than 3, remove the grenade
				}
			}
		},

		//check gets calles when .checkAgainst has been detected
		check: function(other){
			other.receiveDamage(10, this);
			this.kill();
		},

		kill: function(){
			for(var i=0; i<20; i++)
				ig.game.spawnEntity(EntityGrenadeParticle, this.pos.x, this.pos.y);
			this.parent();
		}

	}); //END EntityGrenade
	
	
	//this class handles spawning particle entities for death animation
	EntityDeathExplosion = ig.Entity.extend({

		lifetime: 1,
		callBack: null,
		particles: 25,

		init: function(x, y, settings){
			this.parent(x, y, settings);
			for (var i = 0; i < this.particles; i++)
				//red for player, green for zombie
				//if the player is hit, colorOffset menjadi 0, generate random red color
				ig.game.spawnEntity(EntityDeathExplosionParticle, x, y, 
					{colorOffset: settings.colorOffset ? settings.colorOffset: 0});
				//timer to keep track berapa lama setelah menjadi partikel
				this.idleTimer = new ig.Timer();
		},

		update: function(){
			if(this.idleTimer.delta() > this.lifetime){
				this.kill();
				if(this.callBack)
					this.callBack();
				return;
			}
		}

	}); //END EntityDeathExplosion


	EntityDeathExplosionParticle = ig.Entity.extend({
		
		size: {x:2, y:2},
		maxVel: {x:160, y:200},
		lifetime: 2,
		fadetime: 1,
		bounciness: 0, //because thi is blood (don't want to bounce like grenade)
		vel: {x:100, y:30},
		friction: {x:100, y:0},
		collides: ig.Entity.COLLIDES.LITE,
		colorOffset: 0,
		totalColors: 7,
		animSheet: new ig.AnimationSheet('media/blood.png', 2, 2),

		init: function(x, y, settings){
			this.parent(x, y, settings);
			var frameID = Math.round(Math.random()*this.totalColors) + 
				(this.colorOffset*(this.totalColors+1));
			this.addAnim('idle', 0.2, [frameID]);
			//assign random value to vel.x and vel.y
			//dimana partikel akan dilemparkan ke arah yg berbeda beda
			this.vel.x = (Math.random()*2-1) * this.vel.x;
			this.vel.y = (Math.random()*2-1) * this.vel.y;
			this.idleTimer = new ig.Timer();
		},

		update: function(){
			if(this.idleTimer.delta() > this.lifetime){
				this.kill();
				return;
			}
			//assign new alpha value after each update
			//eventually the particles disappear
			//after disappear, kill() from display
			this.currentAnim.alpha = this.idleTimer.delta().map(
				this.lifetime-this.fadetime, this.lifetime, 1, 0);
			this.parent();
		}

	}); //END EntityDeathExplosionParticle

	
	EntityGrenadeParticle = ig.Entity.extend({
		size: {x:1 , y:1},
		maxVel: {x: 160, y:200},
		lifetime: 1,
		fadetime: 1,
		bounciness: 0.3,
		vel: {x: 40, y: 50},
		friction: {x: 20, y: 20},
		checkAgainst: ig.Entity.TYPE.B,
		collides: ig.Entity.COLLIDES.LITE,
		animSheet: new ig.AnimationSheet('media/explosion.png', 1, 1),

		init: function(x,y,settings){

			this.parent(x,y,settings);
			this.vel.x = (Math.random()*4-1) * this.vel.x;
			this.vel.y = (Math.random()*10-1) * this.vel.y;
			this.idleTimer = new ig.Timer();
			var frameID = Math.round(Math.random()*7);
			this.addAnim('idle', 0.2, [frameID]);
		},

		//sama dengan update function EntityDeathExplosionParticle
		update: function(){

			if(this.idleTimer.delta() > this.lifetime){
				this.kill();
				return;
			}
			
			this.currentAnim.alpha = this.idleTimer.delta().map(
				this.lifetime-this.fadetime, this.lifetime, 1, 0);
			this.parent();
		}
	});



}); //END .defines