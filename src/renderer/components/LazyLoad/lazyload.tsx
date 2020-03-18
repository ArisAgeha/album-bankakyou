import React, { PureComponent } from 'react';

export interface ILazyLoadingProps {
    lazyLoading: boolean;
}

export interface ILazyLoadingState {
    visible: boolean;
}

export const getScrollTop = () => {
    let scrollTop = 0;
    if (document.documentElement && document.documentElement.scrollTop) {
        scrollTop = document.documentElement.scrollTop;
    } else if (document.body) {
        scrollTop = document.body.scrollTop;
    }
    return scrollTop;
};

const checkInPage = (el: any) => {
    const pageHeight = document.documentElement.clientHeight;
    const contentTop = el.getBoundingClientRect().top;
    const contentHeight = el.offsetHeight;
    return (contentTop < pageHeight && contentTop >= 0) || (contentTop < 0 && contentTop + contentHeight > 0);
};

const lazyLoading = ({ minHeight = 0 }) => (ChildComponent: any) =>
    class extends PureComponent<ILazyLoadingProps, ILazyLoadingState> {
        el: any;

        static defaultProps = {
            lazyLoading: true
        };

        state = {
            visible: false
        };

        checkInPage = () => {
            console.log(this.el);
            const isVisible = checkInPage(this.el);
            const { visible } = this.state;
            if (visible) {
                window.removeEventListener('scroll', this.checkInPage);
                return;
            }
            this.setState({ visible: isVisible });
        };

        componentDidMount() {
            if (!this.props.lazyLoading) {
                return;
            }
            this.checkInPage();
        }

        componentWillUnmount() {
            if (!this.props.lazyLoading) {
                return;
            }
            window.removeEventListener('scroll', this.checkInPage);
        }

        render() {
            if (!this.props.lazyLoading) {
                return { ChildComponent };
            }

            return (
                <div ref={el => (this.el = el)} style={{ minHeight }}>
                    {this.state.visible && ChildComponent}
                </div>
            );
        }
    };

export default lazyLoading;
