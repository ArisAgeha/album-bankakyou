import * as React from 'react';
import style from './select.scss';
import { isUndefinedOrNull, isNumber, isArray } from '@/common/utils/types';
import { render } from 'react-dom';
import { ArrowDownOutlined, DownOutlined } from '@ant-design/icons';
import { toggleArrayItem } from '@/common/utils/functionTools';

export type OptionProps = {
    key?: string;
    value: any;
    children: string;
};

export interface ISelectProps {
    value: any | any[];
    children: JSX.Element[];
    onChange?(value: any | any[]): void;
    placeholder?: string;
    tabIndex?: number;
}

export interface ISelectState {
    isVisible: boolean;
    selectedIndex: number[];
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
            selectedIndex: [0]
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
        const selectedIndex: number[] = [];

        if (isArray(value)) {
            this.props.children.forEach((option, index) => {
                if (value.includes(option.props.value)) {
                    selectedIndex.push(index);
                }
            });
        } else {
            const index = this.props.children.findIndex(option => option.props.value === value);
            if (index !== -1) selectedIndex.push(index);
        }

        this.setState({
            selectedIndex
        });
    }

    selectItem = (optionProps: OptionProps, index: number) => {
        if (!isArray(this.props.value)) {
            this.setState({
                isVisible: false
            });

            this.inputRef.current.blur();

            if (this.props.onChange) this.props.onChange(optionProps.value);
        }
        else {
            const selectedIndex = toggleArrayItem(this.state.selectedIndex, index);
            const value = selectedIndex.map(i => this.props.children[i].props.value);

            this.setState({
                selectedIndex
            });

            if (this.props.onChange) this.props.onChange(value);
        }
    }

    cancelSelectByTab = () => {
        this.inputRef.current.selectionStart = this.inputRef.current.selectionEnd;
    }

    toggleDropdown = (e: React.MouseEvent) => {
        e.preventDefault();
        this.state.isVisible ? this.inputRef.current.blur() : this.inputRef.current.focus();
    }

    toggleDropdownByArrow = (e: React.MouseEvent) => {
        this.state.isVisible
            ? this.inputRef.current.blur()
            : setTimeout(() => {
                this.inputRef.current.focus();
            }, 0);
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
        if (!this.state.isVisible || isArray(this.props.value)) return;
        const firstSelectedIndex = this.state.selectedIndex[0];

        if (e.key === 'ArrowUp') {
            const selectedIndex = Math.abs(firstSelectedIndex - 1) % this.props.children.length;
            this.setState({
                selectedIndex: [selectedIndex]
            });
        }
        else if (e.key === 'ArrowDown') {
            const selectedIndex = Math.abs(firstSelectedIndex + 1) % this.props.children.length;
            this.setState({
                selectedIndex: [selectedIndex]
            });
        }
        else if (e.key === 'Enter') {
            const value = this.props.children[firstSelectedIndex].props.value;
            this.props.onChange(value);
            this.setState({ isVisible: false });
        }
    }

    handleMouseEnter = (index: number) => {
        if (isArray(this.props.value)) return;
        this.setState({ selectedIndex: [index] });
    }

    render() {
        const MAX_TEXT_LENGTH = 12;
        const { children, placeholder } = this.props;
        const tabIndex = isNumber(this.props.tabIndex) ? this.props.tabIndex : 1;

        let value = null;

        if (isArray(this.props.value)) {
            const curOpts = this.props.children.filter(option => this.props.value.includes(option.props.value));
            const curOptProps = curOpts.map(curOpt => curOpt?.props?.children || null).filter(opt => !isUndefinedOrNull(opt));
            value = curOptProps
                .reduce((prevVal, curVal) => prevVal + ', ' + curVal, '')
                .slice(2, MAX_TEXT_LENGTH + 2);
            if (value.length === 0 && placeholder) value = placeholder;
            else if (this.props.value.length > 1) value += '...';

        } else {
            const curOpt = this.props.children.find(option => option.props.value === this.props.value);
            const curOptProps = curOpt?.props || null;

            value = isUndefinedOrNull(curOptProps)
                ? placeholder
                    ? placeholder
                    : ''
                : curOptProps.children;
        }

        const span = document.createElement('span');
        span.innerText = value;
        document.body.appendChild(span);
        const textWidth = span.getBoundingClientRect().width;
        document.body.removeChild(span);

        return (
            <div className={style.select}>
                <div onMouseDown={this.toggleDropdownByArrow} className={style.iconWrapper}>
                    <DownOutlined></DownOutlined>
                </div>
                <input
                    tabIndex={tabIndex}
                    ref={this.inputRef}
                    className={`${style.input} ${this.state.isVisible ? style.active : ''}`}
                    type='text'
                    readOnly
                    placeholder={isUndefinedOrNull(placeholder) ? '' : placeholder}
                    value={value}
                    style={{ width: `${textWidth + 72}px` }}
                    onSelect={this.cancelSelectByTab}
                    onMouseDown={this.toggleDropdown}
                    onFocus={this.openDropdown}
                    onBlur={this.closeDropdown}
                    onKeyDown={this.handleKeydown}
                />
                <div className={`${style.dropdown} ${this.state.isVisible ? style.visible : ''}`}>
                    {
                        children.map((option, index) =>
                            (
                                <div
                                    className={`${style.option} ${this.state.selectedIndex.includes(index) ? style.active : ''}`}
                                    key={option.key || index}
                                    onMouseEnter={() => { this.handleMouseEnter(index); }}
                                    onMouseDown={(e: React.MouseEvent) => {
                                        e.preventDefault();
                                        this.selectItem(option.props, index);
                                    }}>
                                    {option.props.children}
                                </div>
                            ))
                    }
                </div>
            </div>
        );
    }
}
