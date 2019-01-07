playSound = (time = 1000, freq = 300, type = 'sine', volume = 0.5, pretty = true) => { //sine triangle sawtooth square
    let ctx = new AudioContext(); // one context per document
    let osc = ctx.createOscillator(); // instance of oscillator
    let vol = ctx.createGain();
    vol.gain.value = volume; // from 0 to 1, 1 full volume, 0 is muted
    osc.type = type; // this is the default - also square, sawtooth, triangle
    osc.frequency.value = freq; //Hz
    // osc.connect(ctx.destination); // connect it to the destination
    osc.connect(vol); // connect osc to vol
    vol.connect(ctx.destination); // connect vol to context destination
    osc.start(ctx.currentTime); // start the oscillator
    if (pretty) vol.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + time / 1000); //pretty sound
    setTimeout(() => {
        osc.stop(ctx.currentTime); // stop 2 seconds after the current time
        vol.disconnect(ctx.destination);
        osc.disconnect(vol);
        osc = vol = ctx = null;
    }, time);
}