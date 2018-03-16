import { Component, OnInit } from '@angular/core';
import { CollaborationService } from '../../services/collaboration.service';
import { ActivatedRoute, Params } from '@angular/router';
// we want data service to handle the submition request
import { DataService } from '../../services/data.service';
//import { Subscription } from 'rxjs/Subscription'; 

declare var ace: any;

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  public languages: string[] = ['Java', 'Python'];
  language: string = 'Java';
  sessionId: string;

  editor: any;
  output: string = ''; // for storing build and run output

  constructor(private collaboration: CollaborationService,
              private route: ActivatedRoute,
              private dataService: DataService) { }

  defaultContent = {
    'Java': `public class Example {
      public static void main(String[] args) {
        // Type your Java code here.
      }
    }`,
    'Python': `class solution:
      def example():
        # write your python code here.
    `
  }

  ngOnInit() {
    // use problem id as session id
    this.route.params
      .subscribe(params => {
        this.sessionId = params['id'];
        this.initEditor();
        this.collaboration.restoreBuffer();
      });   
  }

  initEditor(): void {
    this.editor = ace.edit("editor");
    this.editor.setTheme("ace/theme/eclipse");
    this.resetEditor();  
    
    // setup collaboration socket
    this.collaboration.init(this.editor, this.sessionId);
    this.editor.lastAppliedChange = null;

    // register change callback
    this.editor.on("change", (e) => {
      console.log('editor changes: ' + JSON.stringify(e));
      //check if the change is the same as last change,
      // if they are the same, skip this change
      if (this.editor.lastAppliedChange != e) {
        this.collaboration.change(JSON.stringify(e));
      }
    })
  }

  resetEditor(): void {
    this.editor.setValue(this.defaultContent[this.language]);
    this.editor.getSession().setMode("ace/mode/" + this.language.toLowerCase());
  }

  setLanguage(language: string): void {
    this.language = language;
    // when language changes, need to reset the editor
    this.resetEditor();
  }

  submit(): void {
    let user_code = this.editor.getValue();
    console.log(user_code);
    // create object that contains user's code and language
    // send this to server
    const data = {
      user_code: user_code,
      lang: this.language.toLocaleLowerCase()
    };

    // buildAndRun return a Promise
    this.dataService.buildAndRun(data)
      .then(res => {
        this.output = res.text;
        console.log(this.output);
      });
  }

}
