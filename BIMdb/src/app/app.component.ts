import { HttpClient, HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { environment } from 'src/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {

  public apiKey=environment.apiKey;

  public searchInput=new FormControl('');
  public inputValue:string='';
  public searching:boolean=false;
  public reloading:boolean=false; 
  public detailsLoading:boolean=false;
  public detailsLoader:number=-1;
  public ready:boolean=false;
  public results:any=[];
  public searchBy:string='Title';
  public releaseYear=new Date().getFullYear();
  public type:string='Movie';
  public page:number=1;
  public page_max:number=0;


  constructor(private httpClient: HttpClient) {
  }

  ngOnInit() {
    console.log(this.releaseYear)
      /* emit all changes to the input control value. */
      this.searchInput.valueChanges.pipe(

        /* delay event emission. */
        debounceTime(200),
        //distinctUntilChanged(),

        /* at least 3 characters are required to handle to many matches error. */
        filter((value:any) => value.length >= 3),

        /* show input. */
        map((input: any) => {
          return input;
        })
      ).subscribe((input: string) => {
        this.searching = true;
        this.page = 1;
        /* send request based on input. */
        this.search(input).subscribe((data:any) => {
          this.searching = false;
          //let response_value=this.scan(data,'Response');
          /* handle 'Movie not found' error, assign results if match is found. */
          if (this.scan(data,'Response') == 'True') {
            this.results = this.scan(data,'Search');
            this.ready = true;
            this.page_max=Math.round(parseInt(data['totalResults'])/10);
          } else {
            this.results=[];
          }

        }, ((error:any) => {
          /* console.log(error) */
          this.searching = false;
        }));

      });
    }

    /* function sends a request and returns results based on user input. */
    public search(input: string):any {
      let parameters:string = input + '&apikey=' + this.apiKey + '&page='+this.page;
      if (this.searchBy=='Year')
        parameters+='&y='+this.releaseYear;
      return this.httpClient.get('http://www.omdbapi.com/?s=' + parameters);
    }

    /* function sends a request and returns results from the next page. value from the last search is used as input. */
    public nextPage():any {
      this.reloading = true;
      this.page++;
      this.search(this.inputValue).subscribe((data:any) => {
        this.results = this.scan(data,'Search');
        this.reloading = false;

      }, ((error:any) => {
        /* console.log(error) */
        this.searching = false;
      }));
    }

  /* function sends a request and returns results from the previous page. value from the last search is used as input. */
    public previousPage():any {
      this.reloading = true;
      this.page--;
      this.search(this.inputValue).subscribe((data:any) => {
        this.results = data['Search'];
        this.reloading = false;

      }, ((error:any) => {
        /* console.log(error) */
        this.searching = false;
      }));
    }


    /* function sends a request to return details for a specific item. item is checked beforehand for details to avoid sending request for the same item. loading is handled with a simple index. */
    public getDetails(movie:any, index:number):any {
      this.detailsLoading = true;
      this.detailsLoader = index;

      if (movie['Details']) {
        this.detailsLoader = -1;
        movie['Details show'] = true;
        this.detailsLoading = false;
      } else {
        this.httpClient.get('http://www.omdbapi.com/?i=' + movie.imdbID + '&apikey=' + this.apiKey).subscribe((data:any)=> {
          this.detailsLoader = -1;
          movie['Details show'] = true;
          movie['Details'] = data;
          this.detailsLoading = false;
        }, ((error:any) => {
          console.log('error: '+error);
        }));
      }
    }

    /* function hides details for a specific item. details are not deleted so no api call is required if details are toggled again. */
    public hideDetails(movie:any):void {
      movie['Details show'] = false;
    }

    /* function resets the search input, results array and the detailsLoader value. */
    public reset():void {
      this.searchInput.reset();
      this.searchInput.setValue('');
      this.results = [];
      this.detailsLoader = -1;
      this.ready = false;
    }

    /* function swaps between title and year as search parameter. */
    public searchBySet(event: any):void {
      let isChecked = event.target.checked;
      if (isChecked)
        this.searchBy='Year';
      else
        this.searchBy='Title'
    }

    /* scan response object to return value based on key. */
    public scan(object:any, field:string):any {
      var key, value;
      if (object instanceof Object) {
        for (key in object) {
          if (object.hasOwnProperty(key)) {
            value = this.scan(object[key], field);  
          }

          if (key === field) {
            return object[key];        
          }
        }
      }

      return value;
    };
  
}

