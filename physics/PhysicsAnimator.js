
const ANIMATOR_PAUSE_CONSECUTIVE_FRAMES = 10;
const ANIMATOR_PAUSE_ZERO_VELOCITY = 1.0;

export default class PhysicsAnimator {
	behaviors = []
	physicsObject = {vx: 0, vy: 0, mass: 0}
	consecutiveFramesWithNoMovement = 0
	screenScale = 1
	lastFrameTS = 0
	isRunning = false
	ticking = false
	isDragging = false

	constructor( View, listener ){
		this.View = View
		this.animatorListener = listener
	}

	doFrame( frameTimeNanos ) {
		if( !this.isRunning ) return;

		if ( this.lastFrameTS ) {
			this.animateFrameWithDeltaTime(
				(frameTimeNanos - this.lastFrameTS) * 1e-9
			);
		}

		this.lastFrameTS = frameTimeNanos;
		this.animatorListener.onAnimationFrame();
		requestAnimationFrame( () => this.doFrame( Date.now() ) )
	}

	addBehavior( behavior ) {
		let idx = 0;
		let behaviors = this.behaviors

		while (behaviors.length > idx && behaviors[idx].priority < behavior.priority) {
			++idx;
		}
		behaviors.splice( idx, 0, behavior );

		this.ensureRunning();
	}

	removeBehavior( behavior ) {
		let behaviors = this.behaviors
		let i = behaviors.length
		while( i-- > 0 ){
			if( behaviors[i] === behavior ){
				behaviors.splice( i, 1 )
				return 
			}
		}
	}

	addTempBehavior(behavior) {
		behavior.isTemp = true;
		this.addBehavior(behavior);
	}

	removeAllBehaviors() {
		this.behaviors = []
		this.physicsObject = {vx: 0, vy: 0, mass: 1}
	}

	removeTempBehaviors() {
		let behaviors = this.behaviors
		let i = behaviors.length
		while (i-- > 0) {
			if (behaviors[i].temp) {
				behaviors.splice(i, 1)
			}
		}
	}

	ensureRunning() {
		this.isRunning || this.startRunning()
	}

	startRunning() {
		this.isRunning = true;
		this.lastFrameTS = 0;
		this.consecutiveFramesWithNoMovement = 0;
		requestAnimationFrame( () => this.doFrame( Date.now() ) )
	}

	stopRunning() {
		this.removeTempBehaviors();
		this.isRunning = false;
	}

	animateFrameWithDeltaTime( deltaTime ) {
		let { physicsObject, behaviors, View } = this
		let hadMovement = false

		behaviors.forEach( behavior => {
			behavior.executeFrameWithDeltaTime(deltaTime, physicsObject);
		})

		let dx = 0;
		let {vx,vy} = physicsObject
		if ( Math.abs(vx) > ANIMATOR_PAUSE_ZERO_VELOCITY ) {
			dx = deltaTime * vx;
			hadMovement = true;
		}

		let dy = 0;
		if ( Math.abs(vy) > ANIMATOR_PAUSE_ZERO_VELOCITY ) {
			dy = deltaTime * vy;
			hadMovement = true;
		}
		
		View.animate( dx, dy )

		let cfwnm = this.consecutiveFramesWithNoMovement
		if( !hadMovement ){
			cfwnm++
		}
		this.consecutiveFramesWithNoMovement = cfwnm

		if (cfwnm >= ANIMATOR_PAUSE_CONSECUTIVE_FRAMES && !this.isDragging) {
			this.stopRunning();
			this.animatorListener.onAnimatorPause();
		}
	}

}