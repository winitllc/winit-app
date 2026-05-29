import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { WinitAuthService } from './util/winit-auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private winitAuth: WinitAuthService,
    private router: Router,
    private storage: Storage,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.storage.create();
    const session = await this.winitAuth.restoreSession();
    if (session) {
      this.router.navigate(['tabs']);
    }
  }
}
