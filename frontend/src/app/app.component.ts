import { Component, OnInit } from '@angular/core';
import { AuthService } from './util/auth.service';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router,
    private storage: Storage
  ) {
    this.initializeApp();
  }

  async ngOnInit(): Promise<void> {
    await this.storage.create();
  }

  initializeApp() {
    this.storage.create();
    this.storage.get('accessToken').then((token) => {
      if (token) {
        //navigate to tabs
        console.log('token found');
        console.log(token);
        AuthService.AccessToken = token;
        this.router.navigate(['tabs']);
      }
    });
  }

}
