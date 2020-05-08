import { notification } from 'antd';
import { emptyCall } from '@/common/utils/functionTools';
import { isUndefinedOrNull } from '@/common/utils/types';

type NotificationOptions = {
    closeOtherNotification?: boolean;
    duration?: number;
};

export const openNotification = (title: string, description: string, options?: NotificationOptions) => {
    const closeOtherNotification = isUndefinedOrNull(options?.closeOtherNotification) ? true : options.closeOtherNotification;
    const duration = isUndefinedOrNull(options?.duration) ? 1.2 : options.duration;

    closeOtherNotification ? notification.destroy() : emptyCall();
    notification.open({
        duration,
        message: title,
        description,
        onClick: () => {
            notification.destroy();
        }
    });
};