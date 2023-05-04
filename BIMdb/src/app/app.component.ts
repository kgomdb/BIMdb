import { HttpClient, HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {

  public apiKey:string='64c52891';

/*   public PARAMS = new HttpParams({
    fromObject: {
      action: "opensearch",
      format: "json",
      origin: "*"
    }
  }); */

  public searchInput=new FormControl('');
  public searching:boolean=false;
  public detailsLoading:boolean=false;
  public detailsLoader:number=-1;
  public ready:boolean=false;
  public results:any=[];


  constructor(private httpClient: HttpClient) {
  }

  ngOnInit() {
      /* emit all changes to the input control value. */
      this.searchInput.valueChanges.pipe(

        /* delay event emission. */
        debounceTime(200),
        distinctUntilChanged(),

        /* at least 3 characters are required to handle to many matches error. */
        filter((value:any) => value.length >= 3),

        /* show input. */
        map((input: any) => {
          return input;
        })
      ).subscribe((input: string) => {
        this.searching = true;
        /* send request based on input. */
        this.searchByTitle(input).subscribe((data:any) => {
          this.searching = false;
          
          /* console.log(data); */

          /* handle 'Movie not found' error, assign results if match is found. */
          if (data['Response'] == 'True') {
            this.results = data['Search'];
            this.ready = true;
            console.log(this.results);
          } else {
            this.results=[];
          }

        }, ((error:any) => {
          /* console.log(error) */
          this.searching = false;
        }));

      });
    }

    /* function sends a request and returns results based on user input.  */
    public searchByTitle(input: string):any {
      if (input === '') {
        return of([]);
      }
      
      return this.httpClient.get('http://www.omdbapi.com/?s=' + input + '&apikey=' + this.apiKey);
    }

    /* function sends a request to return details for a specific item. item is checked beforehand for details to avoid sending request for the same item. loading is handled with a simple index */
    public getDetails(movie:any, index:number):any {
      this.detailsLoading=true;
      this.detailsLoader=index;
      if (movie['Details']) {
        this.detailsLoader=-1;
        movie['Details show']=true;
        this.detailsLoading=false;
      } else {
        this.httpClient.get('http://www.omdbapi.com/?i=' + movie.imdbID + '&apikey=' + this.apiKey).subscribe((data:any)=> {
          this.detailsLoader = -1;
          movie['Details show'] = true;
          movie['Details'] = data;
          this.detailsLoading=false;
        }, ((error:any) => {
          console.log(error);
        }));
      }
     
    }

    /* function hides details for a specific item. details are not deleted so no api call is required if details are toggled again. */
    public hideDetails(movie:any):void {
      movie['Details show']=false;
    }

    /* function resets the search input, results array and the detailsLoader. */
    public reset():void {
      this.searchInput.reset();
      this.searchInput.setValue('');
      this.results = [];
      this.detailsLoader = -1;
      this.ready = false;
    }
  
}

