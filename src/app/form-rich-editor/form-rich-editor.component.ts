import { Component, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import Quill from 'quill';

const SELECTOR = 'rich-editor';

@Component({
    selector: SELECTOR,
    templateUrl: './form-rich-editor.component.html',
    styleUrls: ['./form-rich-editor.component.css']
})
export class FormRichEditorComponent implements OnInit, OnChanges {
    @ViewChild('container', { read: ElementRef }) container: ElementRef;
    @Input() value: any;
    @Output() changed: EventEmitter<any> = new EventEmitter();
    // this one is important, otherwise 'Quill' is undefined
    quill: any = Quill;
    editor: any;

    constructor(public elementRef: ElementRef) {
    }

    ngOnInit(): void {
        const editor = this.container.nativeElement.querySelector('#editor');
        this.editor = new Quill(editor, { theme: 'snow' });
        this.editor.on('editor-change', (eventName, ...args) => {
            this.changed.emit(this.editor.getContents());
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.editor) {
            this.editor.setContents(this.value);
        }
    }
}
