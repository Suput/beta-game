'use strict'
const SPEED = 300 // px/s
const SCROLL_SPEED = 200
var GATE_INTERVAL = 300

var app = new Vue({
    el: '#app',
    data: {
        totalScroll: 0,
        lastGateSpawned: 0,
        previousTimestamp: 0,
        isStarted: false,
        isLost: false,
        drone: {
            pos: {
                top: 0,
                left: 0
            },
            speed: {
                vSpeed: 0,
                hSpeed: 0
            }
        },
        // type Gate = { top: number, left: number, checked:boolean }
        gates: [],
        score: 0
    },
    created() {
        window.addEventListener("keydown", this.keyDownHandler)
        window.addEventListener("keyup", this.keyUpHandler)

        window.requestAnimationFrame(this.gameLoop)
    },
    mounted() {
        this.setDrone()
    },
    beforeDestroy() {
        window.removeEventListener("keydown", this.keyDownHandler)
        window.removeEventListener("keydown", this.keyDownHandler)
    },
    methods: {
        setDrone() {
            const { offsetHeight: hStage, offsetWidth: wStage } = this.$refs.stage;
            const { offsetHeight: hDrone, offsetWidth: wDrone } = this.$refs.drone;

            this.drone.pos.top = hStage - hDrone - 60
            this.drone.pos.left = (wStage - wDrone) / 2
        },
        up() {
            this.drone.speed.vSpeed = -SPEED
        },
        down() {
            this.drone.speed.vSpeed = SPEED
        },
        left() {
            this.drone.speed.hSpeed = -SPEED
        },
        right() {
            this.drone.speed.hSpeed = SPEED
        },
        stop({ vertical, horizontal }) {
            if (vertical) {
                this.drone.speed.vSpeed = 0
            }
            if (horizontal) {
                this.drone.speed.hSpeed = 0
            }
        },
        keyDownHandler(e) {
            if (e.code === "ArrowUp") {
                this.up()
            }
            if (e.code === "ArrowDown") {
                this.down()
            }
            if (e.code === "ArrowRight") {
                this.right()
            }
            if (e.code === "ArrowLeft") {
                this.left()
            }
        },
        keyUpHandler(e) {
            if (e.code === "ArrowUp" || e.code === "ArrowDown") {
                this.stop({ vertical: true })
            }
            if (e.code === "ArrowRight" || e.code === "ArrowLeft") {
                this.stop({ horizontal: true })
            }
        },
        checkin(dronePosLeft, dronePosTop) {
            for (var i = 0; i < this.gates.length; i++) {
                const gate = this.gates[i]
                const droneHorCenter = dronePosLeft + this.$refs.drone.offsetWidth / 2
                const droneVertCenter = dronePosTop + this.$refs.drone.offsetHeight / 2
                if ((droneHorCenter >= gate.left) &&
                    (droneHorCenter <= gate.left + this.$refs.gate.offsetWidth) &&
                    (gate.top <= droneVertCenter) &&
                    (gate.top + this.$refs.gate.offsetHeight >= droneVertCenter) &&
                    (!gate.checked)) {
                    this.score++
                    gate.checked = true
                    console.log('score:', this.score)
                }
            }
        },
        upLevel() {
            if (this.score >= 10)
                GATE_INTERVAL = 270
            if (this.score >= 20)
                GATE_INTERVAL = 240
            if (this.score >= 40)
                GATE_INTERVAL = 180
        },
        gameLoop(timestamp) {
            const dT = timestamp - this.previousTimestamp

            if (this.isStarted) {
                const dX = dT / 1000 * this.drone.speed.hSpeed
                const dY = dT / 1000 * this.drone.speed.vSpeed

                const dS = dT / 1000 * SCROLL_SPEED
                this.totalScroll += dS

                if (this.totalScroll - this.lastGateSpawned > GATE_INTERVAL) {
                    if (this.gates.length < 10) {
                        this.gates.push(this.spawnGate())
                        this.lastGateSpawned = this.totalScroll;
                    }
                }

                if (this.gates.length > 0 && this.gates[0].top > this.$refs.stage.offsetHeight) {

                    const shiftedGates = this.gates.shift()
                    if (!shiftedGates.checked) {
                        this.isStarted = false
                        this.isLost = true
                    }
                }

                this.gates.forEach(element => {
                    element.top += dS
                });

                this.drone.pos.left = this.clamp(this.drone.pos.left + dX, 0, this.$refs.stage.offsetWidth - this.$refs.drone.offsetWidth)
                this.drone.pos.top = this.clamp(this.drone.pos.top + dY, 0, this.$refs.stage.offsetHeight - this.$refs.drone.offsetHeight)

                this.checkin(this.drone.pos.left, this.drone.pos.top)
                this.upLevel()
            }

            this.previousTimestamp = timestamp
            window.requestAnimationFrame(this.gameLoop)
        },
        clamp(param, min, max) {
            if (param < min) return min
            if (param > max) return max
            return param
        },
        spawnGate() {
            const maxX = this.$refs.stage.offsetWidth - this.$refs.gate.offsetWidth;
            return { top: -this.$refs.gate.offsetHeight, left: Math.random() * maxX, checked: false }
        },
        restart() {
            this.isStarted = true
            this.isLost = false
            this.score = 0
            this.gates = []
            this.setDrone()
        }
    }
})