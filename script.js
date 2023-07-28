const main = document.querySelector('main')
const canvas = document.querySelector('#canvas')
const context = canvas.getContext('2d')
const moreArcsBtn = document.querySelector('#moreArcsBtn')
const startBtn = document.querySelector('#startBtn')
canvas.height = canvas.clientHeight
canvas.width = canvas.clientWidth
context.lineWidth = 2

// Placement and size of the animation
const lineYIndex = 0.6
const linePercentageOfTotalWidth = 0.9

// Inital setup settings
const settings = {
    centerArcRadius: 30,
    lineStart: {
        x: canvas.width * ((1 - linePercentageOfTotalWidth) / 2),
        y: canvas.height * lineYIndex,
    },
    lineEnd: {
        x: canvas.width * ((1 + linePercentageOfTotalWidth) / 2),
        y: canvas.height * lineYIndex
    },
    circleCenter: {
        x: canvas.width / 2,
        y: canvas.height * lineYIndex
    },
    maxAngle: 2 * Math.PI,
    startTime: new Date().getTime(),
    numberOfArcs: 15,
    lineLength: (canvas.width * ((1 + linePercentageOfTotalWidth) / 2)) - (canvas.width * ((1 - linePercentageOfTotalWidth) / 2)),
    movingDotRadius: 7,
    loops: 30,
    loopTime: 150,
    pulseDuration: 2000,
    soundEnabled: false,
    colour: '#6b21b6'
}

// Toggle to mute/play audio
const handleSoundToggle = (enabled = !settings.soundEnabled) => {
    settings.soundEnabled = enabled;
}

// If user clicks anywhere it will toggle the audio
canvas.onclick = () => {
    handleSoundToggle()
    main.children[0].children[0].innerHTML = settings.soundEnabled ? "Click anywhere to mute audio" : "Click anywhere to play audio"
}


// Draw an arc, either with fill or stroke
const drawArc = (center, radius, start, end, colour, stroke, opacity) => {
    // Start drawing
    context.beginPath()

    // Draw arc: arc(centerX, centerY, radius, startRadian, endRadian)
    context.arc(center.x, center.y, radius, start, end)

    // Fill or stroke arc
    if (stroke) {
        context.globalAlpha = opacity
        context.strokeStyle = colour
        context.stroke()
    } else {
        context.globalAlpha = opacity
        context.fillStyle = colour
        context.fill()
    }
}

// Find a point on an arc based on the arc radius and the calculated radians
const findPointOnArc = (arcRadius, elapsedTime, velocity) => {
    // Find the total radian covered since page load
    const totalRadian = Math.PI + (elapsedTime * velocity)

    // Modulo the total radian by the max allowed angle
    const modRadian = totalRadian % settings.maxAngle

    // Make the radian bounce instead of resetting to 0
    const adjustedRad = modRadian >= Math.PI ? modRadian : settings.maxAngle - modRadian

    // Use Cos and Sin to get the position on the arc
    let x = arcRadius * Math.cos(adjustedRad) + settings.circleCenter.x
    let y = arcRadius * Math.sin(adjustedRad) + settings.circleCenter.y

    return { x, y }
}

// Find the next impact time
const calculateNextImpactTime = (currentImpactTime, velocity) => {
    // The time it takes to travel a half circle (pi)
    return currentImpactTime + (Math.PI / velocity) * 1000
}

// Find the line opacity based on when the circles impacted
const calculateOpacity = (lastImpactTime, baseOpacity, maxOpacity, duration) => {
    const timeSinceImpact = new Date().getTime() - lastImpactTime
    const percentage = Math.min(timeSinceImpact / duration, 1)
    const opacityDelta = maxOpacity - baseOpacity

    return maxOpacity - (opacityDelta * percentage)
}

// Function to play a selected sound
const playSound = (index) => {
    const audioElement = new Audio(`./audio/note-${index}.wav`)
    audioElement.volume = 0.15;
    audioElement.play()
}

// Create array of objects to describe each arc
arcs = new Array(settings.numberOfArcs).fill().map((value, index) => {
    // Finds the spacing required between each arc
    const radius = settings.centerArcRadius + (((settings.lineLength / 2) - settings.centerArcRadius) / 13) * index
    const colour = settings.colour

    // Calculate the velocity for each arc to complete their number of loops in 150 seconds
    const velocity = (2 * Math.PI * (settings.loops - index)) / settings.loopTime

    // The last impact was 0 milliseconds ago
    const lastImpact = 0

    // The next impact is calculated based on the velocity
    const nextImpact = calculateNextImpactTime(settings.startTime, velocity)

    return { index, radius, velocity, colour, lastImpact, nextImpact }
})

// Drawing function
const draw = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Get elapsed time to calculate movement of circles
    const currentTime = new Date().getTime()
    const elapsedTime = (currentTime - settings.startTime) / 1000

    // Loop over the arc objects to draw each one
    arcs.map((arc, index) => {
        // Calculate an offset to stop the arcs at the same height
        const offset = settings.centerArcRadius * (2 / 5) / arc.radius

        // Get the opacity of the lines based on when the moving dot hits the base
        let arcOpacity = calculateOpacity(arc.lastImpact, 0.15, 0.8, settings.pulseDuration)

        // Draw main arcs
        drawArc(settings.circleCenter, arc.radius, Math.PI + offset, settings.maxAngle - offset, arc.colour, true, arcOpacity)

        // Draw impact circles
        drawArc({ x: settings.circleCenter.x - arc.radius, y: settings.lineStart.y }, settings.movingDotRadius, 0, settings.maxAngle, arc.colour, false, arcOpacity)
        drawArc({ x: settings.circleCenter.x + arc.radius, y: settings.lineStart.y }, settings.movingDotRadius, 0, settings.maxAngle, arc.colour, false, arcOpacity)

        // Draw moving circles
        drawArc(findPointOnArc(arc.radius, elapsedTime, arc.velocity), settings.movingDotRadius, 0, settings.maxAngle, arc.colour, false, 1)

        // if the current time is past the calculated next impact, then an impact occured
        if (currentTime >= arc.nextImpact) {
            // If sound is enabled then play a sound 
            if (settings.soundEnabled) {
                playSound(index)
            }

            //update the last impact property
            arc.lastImpact = arc.nextImpact

            // Get the next impact
            arc.nextImpact = calculateNextImpactTime(arc.nextImpact, arc.velocity)
        }
    })

    // Update each time the screen refreshes
    requestAnimationFrame(draw)
}

draw()

