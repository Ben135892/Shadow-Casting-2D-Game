class Enemy {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.canAttack = true;    
        this.attackInterval = 800; // attack interval in ms
        this.vel = 0.02;
        this.path = [];
        this.foundPath = true;
        this.followingPath = true;
        this.initialTarget = null;
    }

    roundCoords() {
        this.x = roundTo2DP(this.x);
        this.y = roundTo2DP(this.y);
    }

    // find out if enemy is colliding with another player
    isCollidingWith(player) {
        if (this.x + this.w < player.x || this.x > player.x + player.w || 
            this.y + this.h < player.y || this.y > player.y + player.h)
            return false;
        return true;
    }

    // home the enemy in the general direction of the player
    homingDirection(player) {
        const differenceX = player.x - this.x;
        const differenceY = player.y - this.y;

        const magnitude = Math.sqrt(Math.pow(differenceX, 2) + Math.pow(differenceY, 2));
        const directionX = differenceX / magnitude * this.vel;
        const directionY = differenceY / magnitude * this.vel;
        return {x: directionX, y: directionY};
    }

    findPath(player, tileMap) {
        // A* algorithm
        const solver = new AStar(tileMap);
        const startPos = {x: Math.floor(this.x), y: Math.floor(this.y)};
        // move enemy towards center of player
        const endPos = {x: Math.floor(player.x + player.w / 2), y: Math.floor(player.y + player.h / 2)};
        this.path = solver.solve(startPos, endPos);
    }

    moveToPlayer(player, tileMap) {

        const playerCorners = [];
        playerCorners.push({x: player.x, y: player.y});
        playerCorners.push({x: player.x + player.w, y: player.y});
        playerCorners.push({x: player.x, y: player.y + player.h});
        playerCorners.push({x: player.x + player.w, y: player.y + player.h});

        if (!this.isObstacleBetween(playerCorners, tileMap.boundaries)) {
            this.foundPath = false;
            this.followingPath = false;
            this.initialTarget = null;
            const homingDirection = this.homingDirection(player);
            this.x += homingDirection.x;
            this.y += homingDirection.y;
            return;
        }

        if (!this.foundPath) {
            // find a new path
            this.findPath(player, tileMap);
            this.foundPath = true;
        }

        if (!this.followingPath) {
            // move to either first square in path, or second, second will be closer to the player (target)
            if (!this.initialTarget) {

                // if there are no obstacles to the second square of the path, move to that square before following the path to the player
                const corners = [];
                corners.push({x: this.path[1].x, y: this.path[1].y});
                corners.push({x: this.path[1].x + 1, y: this.path[1].y});
                corners.push({x: this.path[1].x, y: this.path[1].y + 1});
                corners.push({x: this.path[1].x + 1, y: this.path[1].y + 1});

                if (this.isObstacleBetween(corners, tileMap.boundaries)) 
                    this.initialTarget = this.path[0];
                else 
                    this.initialTarget = this.path[1];
            }

            const differenceX = this.initialTarget.x - this.x;
            const differenceY = this.initialTarget.y - this.y;
            const magnitude = Math.sqrt(Math.pow(differenceX, 2) + Math.pow(differenceY, 2));
            this.x += differenceX / magnitude * this.vel;
            this.y += differenceY / magnitude * this.vel;
            if (differenceX > 0 && this.x >= this.initialTarget.x || differenceX < 0 && this.x <= this.initialTarget.x ||
                differenceY > 0 && this.y >= this.initialTarget.y || differenceY < 0 && this.y <= this.initialTarget.y) 
            {
                this.x = this.initialTarget.x;
                this.y = this.initialTarget.y;
                this.findPath(player, tileMap);
                this.followingPath = true;
            }
            return;
        }

        let moveX = this.path[1].x - this.path[0].x;
        let moveY = this.path[1].y - this.path[0].y;
        this.x += moveX * this.vel;
        this.y += moveY * this.vel;
        if (moveX > 0 && this.x >= this.path[1].x || moveX < 0 && this.x <= this.path[1].x ||
            moveY > 0 && this.y >= this.path[1].y || moveY < 0 && this.y <= this.path[1].y) {
            this.x = this.path[1].x;
            this.y = this.path[1].y;
            this.findPath(player, tileMap);
        }
        
    }
    
    // returns if there is an obstacle between the enemy and a tile square (array of corners)
    isObstacleBetween(corners, boundaries) {
    
        const enemyCorners = [];
        enemyCorners.push({x: this.x, y: this.y});
        enemyCorners.push({x: this.x + this.w, y: this.y});
        enemyCorners.push({x: this.x, y: this.y + this.h});
        enemyCorners.push({x: this.x + this.w, y: this.y + this.h});

        for (let i = 0; i < 4; i++) {
            const differenceX = corners[i].x - enemyCorners[i].x;
            const differenceY = corners[i].y - enemyCorners[i].y;
            const distance = Math.sqrt(Math.pow(differenceX, 2) + Math.pow(differenceY, 2));

            const ray = new Ray(enemyCorners[i], {x: differenceX, y: differenceY});
            const intersection = ray.castWalls(boundaries);
            const intersectionDistance = Math.sqrt(Math.pow(intersection.x - enemyCorners[i].x, 2) + Math.pow(intersection.y - enemyCorners[i].y, 2));
            if (intersectionDistance < distance) 
                return true;
        }
        return false;
    }

    // draw enemy relative to player
    drawRelativeTo(ctx, visibleTiles, player, tileWidth, tileHeight) {
        const drawPos = player.drawRelativeTo({x: this.x, y: this.y}, visibleTiles);
        ctx.fillRect(drawPos.x * tileWidth, drawPos.y * tileHeight, this.w * tileWidth, this.h * tileHeight);
    }

}