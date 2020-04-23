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
                moveSlice.y += moveEvent.movementY;

                if (moveSlice.x > this.MIN_DETECT_DISTANCE || moveSlice.y > this.MIN_DETECT_DISTANCE) {
                    const direction = this.getDirection(moveSlice.x, moveSlice.y);
                    const latestMoveStep = moveStep[moveStep.length - 1];
                    if (moveStep.length > 0 && latestMoveStep.direction === direction) {
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
                ? Math.max(realAction.deltaX, realAction.deltaY)
                : Math.sqrt(realAction.deltaX ** 2 + realAction.deltaY ** 2);

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

    resumu() {
        this.isPause = false;
    }

    destroy() { }

    private getDirection(x: number, y: number): Direction {
        let direction: Direction = 'T';
        const tanh225 = Math.tanh(22.5);
        const tanh675 = Math.tanh(67.5);
        if (x === 0) return y > 0 ? 'T' : 'B';
        if (y === 0) return x > 0 ? 'R' : 'L';

        const res = y / x;

        if (y > 0) {
            if (res > tanh675) direction = 'T';
            else if (tanh675 > res && res > tanh225) direction = 'TR';
            else if (tanh225 > res && res > -tanh225) direction = 'R';
            else if (-tanh225 > res && res > -tanh675) direction = 'RB';
            else direction = 'B';
        }
        else {
            if (res > tanh675) direction = 'B';
            else if (tanh675 > res && res > tanh225) direction = 'BL';
            else if (tanh225 > res && res > -tanh225) direction = 'L';
            else if (-tanh225 > res && res > -tanh675) direction = 'LT';
            else direction = 'T';
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