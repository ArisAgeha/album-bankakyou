import { isArray } from '@/common/utils/types';

export type GestureHandler = () => void;

export interface GestureList {
    [key: string]: GestureHandlerItem[];
}

export type GestureHandlerItem = {
    gestureHandler: GestureHandler;
    gestureAction: GestureAction[];
};

export type KeyType = {
    mouseType: 'L' | 'R' | 'LR' | 'M';
    ctrlKey?: boolean;
    shiftKey?: boolean;
};

export type Direction = 'T' | 'TR' | 'R' | 'RB' | 'B' | 'BL' | 'L' | 'LT';

export interface GestureAction {
    direction: Direction;
    minDistance?: number;
    maxDistance?: number;
    maxSpendTime?: number;
}

export type MoveStep = {
    deltaX: number;
    deltaY: number;
    direction: Direction;
    spendTime: number;
};

class GestureFactory {
    gestureList: GestureList = {};
    isPause: boolean;
    MIN_DETECT_DISTANCE: number = 100;

    constructor() {
        this.initListener();
    }

    private initListener() {
        window.addEventListener('mousedown', (downEvent: MouseEvent) => {
            if (this.isPause) return;

            const mouseType = this.getMouseTypeFromButtons(downEvent.buttons);
            if (!mouseType) return;

            const keyType: KeyType = {
                mouseType,
                ctrlKey: downEvent.ctrlKey,
                shiftKey: downEvent.shiftKey
            };

            const moveStep: MoveStep[] = [];
            const moveSlice = { x: 0, y: 0 };
            let timer = 0;

            const onMove = (moveEvent: MouseEvent) => {
                moveSlice.x += moveEvent.movementX;
                moveSlice.y -= moveEvent.movementY;

                if (Math.abs(moveSlice.x) > this.MIN_DETECT_DISTANCE || Math.abs(moveSlice.y) > this.MIN_DETECT_DISTANCE) {
                    const direction = this.getDirection(moveSlice.x, moveSlice.y);
                    const latestMoveStep = moveStep[moveStep.length - 1];

                    if (moveStep.length > 0 && latestMoveStep?.direction === direction) {
                        latestMoveStep.deltaX += moveSlice.x;
                        latestMoveStep.deltaY += moveSlice.y;
                        latestMoveStep.spendTime = Number(Date.now()) - timer;
                    }
                    else {
                        timer = Number(Date.now());
                        moveStep.push({
                            deltaX: moveSlice.x,
                            deltaY: moveSlice.y,
                            direction,
                            spendTime: 0
                        });
                    }
                    moveSlice.x = 0;
                    moveSlice.y = 0;
                }
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', (upEvent: MouseEvent) => {
                window.removeEventListener('mousemove', onMove);

                this.checkHandlerList(moveStep, keyType);

            }, { once: true });
        });
    }

    private checkHandlerList(moveStep: MoveStep[], keyType: KeyType) {
        const identifier = this.getIdentifier(keyType);
        const handlerStore = this.gestureList[identifier];
        if (!isArray(handlerStore)) return;

        handlerStore.forEach(handler => {
            this.checkShouldInvokeHandler(handler, moveStep);
        });
    }

    private checkShouldInvokeHandler(handler: GestureHandlerItem, realMoveStep: MoveStep[]): void {
        const { gestureAction, gestureHandler } = handler;
        if (gestureAction.length > realMoveStep.length) return;
        for (let i = 0; i < gestureAction.length; i++) {
            const expectedAction = gestureAction[i];
            const realAction = realMoveStep[i];

            const { direction, maxDistance, maxSpendTime } = expectedAction;

            if (direction !== realAction.direction) return;
            if (maxSpendTime && maxSpendTime < realAction.spendTime) return;

            const realDistance = realAction.direction.length === 1
                ? Math.max(Math.abs(realAction.deltaX), Math.abs(realAction.deltaY))
                : Math.sqrt(Math.abs(realAction.deltaX) ** 2 + Math.abs(realAction.deltaY) ** 2);

            if (maxDistance && maxDistance < realDistance) return;

            const minDistance = expectedAction.minDistance ? Math.max(expectedAction.minDistance, this.MIN_DETECT_DISTANCE) : this.MIN_DETECT_DISTANCE;
            if (minDistance > realDistance) return;

            gestureHandler();
        }
    }

    registry(keyType: KeyType, gestureAction: GestureAction[], callback: GestureHandler): void {
        const identifier = this.getIdentifier(keyType);
        this.saveGestureHandler(identifier, gestureAction, callback);
    }

    remove(keyType: KeyType, callback: GestureHandler) {
        const identifier = this.getIdentifier(keyType);
        const targetStore = this.gestureList[identifier];
        if (isArray(targetStore)) {
            const targetIndex = targetStore.findIndex((handlerStore) => handlerStore.gestureHandler === callback);
            if (targetIndex !== -1) targetStore.splice(targetIndex, 1);
        }
    }

    pause() {
        this.isPause = true;
    }

    resume() {
        this.isPause = false;
    }

    private getDirection(x: number, y: number): Direction {
        let direction: Direction = 'T';
        const tan225 = Math.tan(Math.PI / 180 * 22.5); // 0.41
        const tan675 = Math.tan(Math.PI / 180 * 67.5); // 2.4
        if (x === 0) return y > 0 ? 'T' : 'B';
        if (y === 0) return x > 0 ? 'R' : 'L';

        const res = y / x;

        if (y > 0) {
            if (res > 0 && res < tan225) direction = 'R';
            else if (res > tan225 && res < tan675) direction = 'TR';
            else if (res > tan675 || res < -tan675) direction = 'T';
            else if (res > -tan675 && res < -tan225) direction = 'LT';
            else direction = 'L';
        }
        else {
            if (res > 0 && res < tan225) direction = 'L';
            else if (res > tan225 && res < tan675) direction = 'BL';
            else if (res > tan675 || res < -tan675) direction = 'B';
            else if (res > -tan675 && res < -tan225) direction = 'RB';
            else direction = 'R';
        }

        return direction;
    }

    private saveGestureHandler(identifier: string, gestureAction: GestureAction[], gestureHandler: GestureHandler) {
        if (!isArray(this.gestureList[identifier])) {
            this.gestureList[identifier] = [
                {
                    gestureAction,
                    gestureHandler
                }
            ];
        }
        else if (!this.gestureList[identifier].some((handlerStore) => handlerStore.gestureHandler === gestureHandler)) {
            this.gestureList[identifier].push({ gestureHandler, gestureAction });
        }
    }

    private getMouseTypeFromButtons(buttons: number) {
        if (buttons === 1) return 'L';
        else if (buttons === 2) return 'R';
        else if (buttons === 3) return 'LR';
        else if (buttons === 4) return 'M';
        else return null;
    }

    private getIdentifier(keyType: KeyType) {
        const { mouseType, ctrlKey, shiftKey } = keyType;
        return `${ctrlKey ? 'c' : ''}${shiftKey ? 's' : ''}${mouseType}`;
    }
}

export const Gesture = new GestureFactory();