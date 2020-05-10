import { notification } from 'antd';
import { emptyCall } from '@/common/utils/functionTools';
import { isUndefinedOrNull } from '@/common/utils/types';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import { textObj } from '../parts/infoBar/infoBar';

type NotificationOptions = {
    closeOtherNotification?: boolean;
    duration?: number;
    btn?: React.ReactNode;
};

export const openNotification = (title: string, description: string | React.ReactNode, options?: NotificationOptions) => {
    const closeOtherNotification = isUndefinedOrNull(options?.closeOtherNotification) ? true : options.closeOtherNotification;
    const duration = isUndefinedOrNull(options?.duration) ? 1.2 : options.duration;
    const btn = isUndefinedOrNull(options?.btn) ? null : options.btn;

    closeOtherNotification ? notification.destroy() : emptyCall();
    notification.open({
        duration,
        message: title,
        description,
        btn
    });
};

export function hintText(textObj: textObj[]) {
    EventHub.emit(eventConstant.HINT_TEXT, textObj);
}

export function hintMainText(text: string) {
    EventHub.emit(eventConstant.HINT_MAIN_TEXT, text || '');
}