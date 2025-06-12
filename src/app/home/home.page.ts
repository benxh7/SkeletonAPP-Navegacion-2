import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DbTaskService } from '../services/dbtask.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})

export class HomePage {
  tab: 'datos' | 'exp' | 'cert' = 'datos';
  username = '';

  constructor(private router: Router, private db: DbTaskService) {
    const nav = this.router.getCurrentNavigation();
    this.username = nav?.extras?.state?.['username'] ?? '';
  }

  ngOnInit() { }
}
