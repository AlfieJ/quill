import { Component, ViewChild, ElementRef, Input, AfterViewInit, forwardRef, OnDestroy, Injector, DoCheck, HostBinding, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, NgControl } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import Quill from 'quill';
import { Subject } from 'rxjs';
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'rich-editor',
    templateUrl: './form-rich-editor.component.html',
    styleUrls: ['./form-rich-editor.component.css'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => FormRichEditorComponent),
        multi: true,
    },
    {
        provide: MatFormFieldControl,
        useExisting: FormRichEditorComponent,
    }],
    // tslint:disable-next-line:no-host-metadata-property
    host: {
        '[id]': 'id',
        '[attr.aria-describedBy]': 'describedBy',
    }
})
export class FormRichEditorComponent implements OnInit, AfterViewInit, ControlValueAccessor, MatFormFieldControl<any>, OnDestroy, DoCheck {
    static nextID: number = 1;

    @ViewChild('container', { read: ElementRef }) container: ElementRef;
    @HostBinding() id: string = `rich-editor-input-${FormRichEditorComponent.nextID++}`;
    // @HostBinding('class.floating') get shouldLabelFloat(): boolean {
    //     return this.focused || !this.empty;
    // }
    @HostBinding('attr.aria-describedby') describedBy = '';

    get value(): any {
        return this._value;
    }

    set value(value: any) {
        this._value = value;
        this.editor.setContents(this._value);
        this.onChange(value);
        this.stateChanges.next();
    }

    @Input() get placeholder(): string {
        return this._placeholder;
    }

    set placeholder(p: string) {
        this._placeholder = p;
        this.stateChanges.next();
    }

    @Input() get required(): boolean {
        return this._required;
    }

    set required(r: boolean) {
        this._required = coerceBooleanProperty(r);
        this.stateChanges.next();
    }

    @Input() get disabled(): boolean {
        return this._disabled;
    }

    set disabled(d: boolean) {
        this._disabled = coerceBooleanProperty(d);
        this.stateChanges.next();
    }

    get empty(): boolean {
        if (!this.editor) {
            return false;
        }
        const commentText: string = this.editor.getText().trim();
        return commentText ? false : true;
    }

    // this one is important, otherwise 'Quill' is undefined
    quill: any = Quill;
    editor: any;

    private _value: any;
    private _placeholder: string;
    private _required: boolean;
    private _disabled: boolean;

    stateChanges: Subject<void>;
    ngControl: NgControl;
    focused: boolean;
    errorState: boolean;
    controlType?: string;
    autofilled?: boolean;

    constructor(public elementRef: ElementRef, public injector: Injector, public fm: FocusMonitor) {
        this.stateChanges = new Subject<void>();
        this.controlType = 'richeditor';
        this.focused = false;
        this.errorState = false;
        this._placeholder = '';
        this._required = false;
        this._disabled = false;

        const t = this;
        this.fm.monitor(elementRef.nativeElement, true).subscribe(origin => {
            t.focused = !!origin;
            t.stateChanges.next();
        });
    }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        this.ngControl = this.injector.get(NgControl);
        if (this.ngControl) {
            this.ngControl.valueAccessor = this;
        }
        const editor = this.container.nativeElement.querySelector('#editor');
        this.editor = new Quill(editor, { theme: 'snow' });
        this.editor.on('editor-change', () => {
            this.onChange(this.getHtml());
        });
    }

    ngOnDestroy(): void {
        this.fm.stopMonitoring(this.elementRef.nativeElement);
        this.stateChanges.complete();
    }

    ngDoCheck(): void {
        if (this.ngControl) {
            this.errorState = this.ngControl.invalid && this.ngControl.touched;
            this.stateChanges.next();
        }
    }

    onContainerClick(event: MouseEvent): void {
        if ((event.target as Element).tagName.toLowerCase() !== 'div') {
            this.container.nativeElement.querySelector('div').focus();
        }
    }

    onChange = (delta: any) => {
    }

    onTouched = () => {
    }

    writeValue(delta: any): void {
        if (!delta) {
            return;
        }

        const c = new QuillDeltaToHtmlConverter(delta.ops, {});
        const html = c.convert();
        console.log('writeValue: ' + html);

        this.editor.setContents(delta);
        this.value.setValue(html);
    }

    registerOnChange(fn: (v: any) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDescribedByIds(ids: string[]): void {
        this.describedBy = ids.join(' ');
    }

    private getHtml(): string | undefined {
        if (!this.editor) {
            return undefined;
        }
        const delta: any = this.editor.getContents();
        if (this.isEmpty(delta)) {
            return undefined;
        }
        const converter = new QuillDeltaToHtmlConverter(delta.ops, {});
        const html: string = converter.convert();
        return html;
    }

    private isEmpty(contents: any): boolean {
        if (contents.ops.length > 1) {
            return false;
        }
        const opsTypes: Array<string> = Object.keys(contents.ops[0]);
        if (opsTypes.length > 1) {
            return false;
        }
        if (opsTypes[0] !== 'insert') {
            return false;
        }
        if (contents.ops[0].insert !== '\n') {
            return false;
        }
        return true;
    }
}
