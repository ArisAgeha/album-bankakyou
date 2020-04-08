import * as React from 'react';
import style from './select.scss';
import { isUndefinedOrNull, isNumber } from '@/common/types';
import { render } from 'react-dom';
import { ArrowDownOutlined } from '@ant-design/icons';

export type OptionProps = {
    key?: string;
    value: any;
    children: string;
};

export interface ISelectProps {
    value: any;
    children: JSX.Element[];
    onChange?(value: any): void;
    placeholder?: string;
    tabIndex?: number;
}

export interface ISelectState {
    isVisible: boolean;
    selectedIndex: number;
}

// export const Option: React.FC<OptionProps> = (props: OptionProps) => <div></div>;

export class Select extends React.PureComponent<ISelectProps, ISelectState> {
    static Option: React.FC<OptionProps> = () => <div></div>;
    inputRef: React.RefObject<HTMLInputElement>;

    constructor(props: ISelectProps) {
        super(props);
        this.inputRef = React.createRef();
        this.state = {
            isVisible: false,
            selectedIndex: 0
        };
    }

    componentDidMount() {
        this.updateSelectedIndex();
    }

    componentDidUpdate(prev: ISelectProps) {
        if (prev.value !== this.props.value) {
            this.updateSelectedIndex();
        }
    }

    updateSelectedIndex = () => {
        const value = this.props.value;
        const selectedIndex = this.props.children.findIndex(option => option.props.value === value);
        this.setState({
            selectedIndex
        });
    }

    selectItem = (optionProps: OptionProps) => {
        if (this.props.onChange) this.props.onChange(optionProps.value);

        this.setState({
            isVisible: false
        });
    }

    cancelSelectByTab = () => {
        this.inputRef.current.selectionStart = this.inputRef.current.selectionEnd;
    }

    cancelSelect = (e: React.MouseEvent) => {
        e.preventDefault();
        this.inputRef.current.focus();
    }

    openDropdown = () => {
        this.setState({ isVisible: true });
    }

    closeDropdown = (e: React.FocusEvent) => {
        setTimeout(() => {
            this.setState({ isVisible: false });
        }, 0);
    }

    handleKeydown = (e: React.KeyboardEvent) => {
        if (!this.state.isVisible) return;

        if (e.key === 'ArrowUp') {
            const selectedIndex = Math.abs(this.state.selectedIndex - 1) % this.props.children.length;
            console.log(selectedIndex);
            this.setState({
                selectedIndex
            });
        }
        else if (e.key === 'ArrowDown') {
            const selectedIndex = Math.abs(this.state.selectedIndex + 1) % this.props.children.length;
            console.log(selectedIndex);
            this.setState({
                selectedIndex
            });
        }
        else if (e.key === 'Enter') {
            const value = this.props.children[this.state.selectedIndex].props.value;
            this.props.onChange(value);
            this.setState({ isVisible: false });
        }
    }

    handleMouseEnter = (index: number) => {
        this.setState({ selectedIndex: index });
    }

    render() {
        const { children, placeholder } = this.props;

        const curOpt = this.props.children.find(option => option.props.value === this.props.value);
        const curOptProps = curOpt?.props || null;

        const tabIndex = isNumber(this.props.tabIndex) ? this.props.tabIndex : 1;
        return (
            <div className={style.select}>
                <input
                    tabIndex={tabIndex}
                    ref={this.inputRef}
                    className={`${style.input} ${this.state.isVisible ? style.active : ''}`}
                    type='text'
                    readOnly
                    placeholder={isUndefinedOrNull(placeholder) ? '' : placeholder}
                    value={isUndefinedOrNull(curOptProps) ? '' : curOptProps.children}
                    onSelect={this.cancelSelectByTab}
                    onMouseDown={this.cancelSelect}
                    onFocus={this.openDropdown}
                    onBlur={this.closeDropdown}
                    onKeyDown={this.handleKeydown}
                />
                <div className={`${style.dropdown} ${this.state.isVisible ? style.visible : ''}`}>
                    {
                        children.map((option, index) =>
                            (
                                <div
                                    className={`${style.option} ${this.state.selectedIndex === index ? style.active : ''}`}
                                    key={option.key || index}
                                    onMouseEnter={() => { this.handleMouseEnter(index); }}
                                    onMouseDown={() => { this.selectItem(option.props); }}>
                                    {option.props.children}
                                </div>
                            ))
                    }
                </div>
            </div>
        );
    }
}
