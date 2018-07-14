ig.module(
	'game.entities.zombie'
)
.requires(
	'impact.entity'
)
.defines(function(){

	EntityZombie = ig.Entity.extend({

		animSheet: new ig.AnimationSheet('media/zombie.png', 16, 16),
		size: {x:8, y:14},
		offset: {x:4, y:2},
		maxVel: {x:100, y:100},
		flip: false,
		friction: {x:150, y:0},
		speed: 14,

		health: 6,

		type: ig.Entity.TYPE.B, //type B untuk enemy atau monster group
		checkAgainst: ig.Entity.TYPE.A, //check dengan player group untuk collision
		collides: ig.Entity.COLLIDES.PASSIVE,



		init: function(x, y, settings){
			this.parent(x, y, settings);
			this.addAnim('walk', .07, [0,1,2,3,4,5]);
		}, // END init

		update: function(){
			//near an edge? return!
			//zombie akan balik arah jika menyentuh apapun yg ada d collision map
			if(!ig.game.collisionMap.getTile(
				this.pos.x + (this.flip ? +4 : this.size.x -4),
					this.pos.y + this.size.y+1
					)
				) {
					this.flip = !this.flip;
			} //END if

			var xdir = this.flip ? -1 : 1;
			this.vel.x = this.speed*xdir;
			this.currentAnim.flip.x = this.flip;
			this.parent();
		}, //END update

		handleMovementTrace: function(res){
			this.parent(res);
			//colission with a wall? return!
			if(res.collision.x){
				this.flip = !this.flip;
			}
		},

		//function ini berfungsi untuk mengaplikasikan damage ke entity yg collide dgn monster
		//other adalah sbg argument untuk any colliding entity passed to the function
		check: function(other){
			other.receiveDamage(10, this);
		},

		//spawn death explosion for zombie
		//pass in smaller nuber of particles
		receiveDamage: function(value){
			this.parent(value);
			if(this.health > 0)
				//colorOffset 1 green blood for zombie
				ig.game.spawnEntity(EntityDeathExplosion, this.pos.x, this.pos.y, 
					{particles: 2, colorOffset: 1});
		},

		//use same death animation when the zombie is killed
		kill: function(){
			this.parent();
			ig.game.spawnEntity(EntityDeathExplosion, this.pos.x, this.pos.y, {colorOffset: 1});
			//add kill count by 1 each time a zombie got killed
			ig.game.stats.kills++;
		},
		

	}); //END EntityZombie



}); //END .defines