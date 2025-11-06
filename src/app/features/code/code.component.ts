import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Branch {
  name: string;
  commitCount: number;
  lastUpdated: Date;
}

interface Repository {
  id: string;
  name: string;
  language: string;
  lastCommit: string;
  stars: number;
  status: 'active' | 'archived';
  branches: Branch[];
  defaultBranch: string;
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  timestamp: Date;
  branch: string;
  repositoryId: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  projectId?: string;
  taskId?: string;
  taskName?: string;
}

@Component({
  selector: 'sm-code',
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.scss'],
  standalone: false
})
export class CodeComponent implements OnInit {
  private router = inject(Router);

  selectedRepository: Repository | null = null;
  selectedBranch: string = '';
  filteredCommits: Commit[] = [];

  repositories: Repository[] = [
    {
      id: 'repo-1',
      name: 'autothought-core',
      language: 'TypeScript',
      lastCommit: '2 hours ago',
      stars: 142,
      status: 'active',
      defaultBranch: 'main',
      branches: [
        {name: 'main', commitCount: 234, lastUpdated: new Date(Date.now() - 2*60*60*1000)},
        {name: 'develop', commitCount: 156, lastUpdated: new Date(Date.now() - 5*60*60*1000)},
        {name: 'feature/theme-update', commitCount: 12, lastUpdated: new Date(Date.now() - 8*60*60*1000)}
      ]
    },
    {
      id: 'repo-2',
      name: 'ml-pipeline',
      language: 'Python',
      lastCommit: '5 hours ago',
      stars: 89,
      status: 'active',
      defaultBranch: 'main',
      branches: [
        {name: 'main', commitCount: 178, lastUpdated: new Date(Date.now() - 5*60*60*1000)},
        {name: 'develop', commitCount: 89, lastUpdated: new Date(Date.now() - 12*60*60*1000)},
        {name: 'experiment/model-optimization', commitCount: 23, lastUpdated: new Date(Date.now() - 24*60*60*1000)}
      ]
    },
    {
      id: 'repo-3',
      name: 'data-processor',
      language: 'Python',
      lastCommit: '1 day ago',
      stars: 56,
      status: 'active',
      defaultBranch: 'main',
      branches: [
        {name: 'main', commitCount: 145, lastUpdated: new Date(Date.now() - 24*60*60*1000)},
        {name: 'develop', commitCount: 67, lastUpdated: new Date(Date.now() - 36*60*60*1000)}
      ]
    },
    {
      id: 'repo-4',
      name: 'ui-components',
      language: 'TypeScript',
      lastCommit: '3 days ago',
      stars: 34,
      status: 'active',
      defaultBranch: 'main',
      branches: [
        {name: 'main', commitCount: 98, lastUpdated: new Date(Date.now() - 72*60*60*1000)},
        {name: 'develop', commitCount: 45, lastUpdated: new Date(Date.now() - 96*60*60*1000)},
        {name: 'feature/code-page', commitCount: 8, lastUpdated: new Date(Date.now() - 120*60*60*1000)},
        {name: 'refactor/components', commitCount: 15, lastUpdated: new Date(Date.now() - 144*60*60*1000)}
      ]
    }
  ];

  allCommits: Commit[] = [
    // autothought-core commits
    {hash: 'a3f4c21', message: 'feat: Add autothought theme colors', author: 'Claude', timestamp: new Date(Date.now() - 2*60*60*1000), branch: 'main', repositoryId: 'repo-1', filesChanged: 5, additions: 234, deletions: 12, projectId: '5b455f9f61764ff8822a54b6609c4315', taskId: 'c67622123b12440daa178beaf3e6cc40', taskName: 'Theme System v2.0'},
    {hash: 'b7e9d31', message: 'fix: Logo sizing in sidebar', author: 'Martin', timestamp: new Date(Date.now() - 5*60*60*1000), branch: 'develop', repositoryId: 'repo-1', filesChanged: 2, additions: 15, deletions: 8, projectId: '5b455f9f61764ff8822a54b6609c4315', taskId: 'a8b9c0d1e2f3440faa278beaf4e7dd51', taskName: 'UI Fixes Sprint 12'},
    {hash: 'c1a2f45', message: 'refactor: Update color palette', author: 'Claude', timestamp: new Date(Date.now() - 8*60*60*1000), branch: 'feature/theme-update', repositoryId: 'repo-1', filesChanged: 3, additions: 87, deletions: 45},
    {hash: 'e4b3d78', message: 'feat: Create code page module', author: 'Claude', timestamp: new Date(Date.now() - 12*60*60*1000), branch: 'main', repositoryId: 'repo-1', filesChanged: 7, additions: 312, deletions: 0, projectId: '5b455f9f61764ff8822a54b6609c4315', taskId: 'b1c2d3e4f5a6550ebb389cfbf5f8ee62', taskName: 'Code Management Feature'},
    {hash: 'k9j8h7g', message: 'test: Add unit tests for theme service', author: 'Martin', timestamp: new Date(Date.now() - 18*60*60*1000), branch: 'develop', repositoryId: 'repo-1', filesChanged: 4, additions: 156, deletions: 23},

    // ml-pipeline commits
    {hash: 'f9c8a12', message: 'feat: Implement hyperparameter tuning', author: 'Martin', timestamp: new Date(Date.now() - 5*60*60*1000), branch: 'main', repositoryId: 'repo-2', filesChanged: 8, additions: 456, deletions: 34, projectId: '5b455f9f61764ff8822a54b6609c4315', taskId: 'd4e5f6a7b8c9660fcc49adcbf6f9ff73', taskName: 'Hyperparameter Optimization'},
    {hash: 'g2d5e89', message: 'chore: Update ML dependencies', author: 'Claude', timestamp: new Date(Date.now() - 12*60*60*1000), branch: 'develop', repositoryId: 'repo-2', filesChanged: 1, additions: 23, deletions: 18, projectId: '5b455f9f61764ff8822a54b6609c4315', taskId: 'e5f6a7b8c9d0770fdd5abedbf7faaa84', taskName: 'Dependency Update'},
    {hash: 'h1f2e3d', message: 'feat: Add data augmentation pipeline', author: 'Martin', timestamp: new Date(Date.now() - 24*60*60*1000), branch: 'experiment/model-optimization', repositoryId: 'repo-2', filesChanged: 6, additions: 289, deletions: 67, projectId: '5b455f9f61764ff8822a54b6609c4315', taskId: 'f6a7b8c9d0e1880fee6bcfecf8fbb95', taskName: 'Data Augmentation v1'},
    {hash: 'i4g5h6j', message: 'fix: Memory leak in training loop', author: 'Claude', timestamp: new Date(Date.now() - 36*60*60*1000), branch: 'main', repositoryId: 'repo-2', filesChanged: 3, additions: 45, deletions: 78},
    {hash: 'j7k8l9m', message: 'perf: Optimize batch processing', author: 'Martin', timestamp: new Date(Date.now() - 48*60*60*1000), branch: 'develop', repositoryId: 'repo-2', filesChanged: 5, additions: 178, deletions: 123, projectId: '5b455f9f61764ff8822a54b6609c4315', taskId: 'a7b8c9d0e1f2990faf7cdafdf9fcca06', taskName: 'Batch Processing Optimization'},

    // data-processor commits
    {hash: 'm1n2o3p', message: 'feat: Add streaming data processor', author: 'Claude', timestamp: new Date(Date.now() - 24*60*60*1000), branch: 'main', repositoryId: 'repo-3', filesChanged: 9, additions: 567, deletions: 45, projectId: '5b455f9f61764ff8822a54b6609c4315', taskId: 'b8c9d0e1f2a3aa0fba8debebfafddb17', taskName: 'Real-time Processing'},
    {hash: 'n4o5p6q', message: 'fix: Handle edge cases in CSV parser', author: 'Martin', timestamp: new Date(Date.now() - 36*60*60*1000), branch: 'develop', repositoryId: 'repo-3', filesChanged: 2, additions: 34, deletions: 12},
    {hash: 'o7p8q9r', message: 'refactor: Improve error handling', author: 'Claude', timestamp: new Date(Date.now() - 48*60*60*1000), branch: 'main', repositoryId: 'repo-3', filesChanged: 7, additions: 123, deletions: 89, projectId: '5b455f9f61764ff8822a54b6609c4315', taskId: 'c9d0e1f2a3b4bb0fcb9dfcfcfbfeec28', taskName: 'Error Handling Improvements'},
    {hash: 'p1q2r3s', message: 'docs: Add API documentation', author: 'Martin', timestamp: new Date(Date.now() - 60*60*60*1000), branch: 'develop', repositoryId: 'repo-3', filesChanged: 3, additions: 234, deletions: 5},

    // ui-components commits
    {hash: 'q4r5s6t', message: 'feat: Create interactive code viewer', author: 'Claude', timestamp: new Date(Date.now() - 72*60*60*1000), branch: 'main', repositoryId: 'repo-4', filesChanged: 12, additions: 678, deletions: 23, projectId: '5b455f9f61764ff8822a54b6609c4315', taskId: 'd0e1f2a3b4c5cc0fdc0aeadfdfcfffd39', taskName: 'Code Viewer Component'},
    {hash: 'r7s8t9u', message: 'style: Update component styling', author: 'Martin', timestamp: new Date(Date.now() - 96*60*60*1000), branch: 'feature/code-page', repositoryId: 'repo-4', filesChanged: 4, additions: 89, deletions: 45},
    {hash: 's1t2u3v', message: 'refactor: Extract reusable components', author: 'Claude', timestamp: new Date(Date.now() - 120*60*60*1000), branch: 'refactor/components', repositoryId: 'repo-4', filesChanged: 8, additions: 345, deletions: 234, projectId: '5b455f9f61764ff8822a54b6609c4315', taskId: 'e1f2a3b4c5d6dd0fed1bfbefefdaaae4a', taskName: 'Component Refactoring'},
    {hash: 't4u5v6w', message: 'test: Add integration tests', author: 'Martin', timestamp: new Date(Date.now() - 144*60*60*1000), branch: 'develop', repositoryId: 'repo-4', filesChanged: 6, additions: 456, deletions: 12},
    {hash: 'u7v8w9x', message: 'fix: Responsive layout issues', author: 'Claude', timestamp: new Date(Date.now() - 168*60*60*1000), branch: 'main', repositoryId: 'repo-4', filesChanged: 3, additions: 67, deletions: 34, projectId: '5b455f9f61764ff8822a54b6609c4315', taskId: 'f2a3b4c5d6e7ee0ffe2cfccfaffeebbb5b', taskName: 'Responsive Design Fixes'}
  ];

  displayedColumns: string[] = ['hash', 'message', 'author', 'branch', 'timestamp', 'changes'];

  ngOnInit(): void {
    if (this.repositories.length > 0) {
      this.selectRepository(this.repositories[0]);
    }
  }

  selectRepository(repo: Repository): void {
    this.selectedRepository = repo;
    this.selectedBranch = repo.defaultBranch;
    this.updateFilteredCommits();
  }

  onBranchChange(): void {
    this.updateFilteredCommits();
  }

  updateFilteredCommits(): void {
    if (!this.selectedRepository) {
      this.filteredCommits = [];
      return;
    }

    this.filteredCommits = this.allCommits.filter(
      commit => commit.repositoryId === this.selectedRepository!.id &&
                commit.branch === this.selectedBranch
    );
  }

  navigateToTask(commit: Commit): void {
    if (commit.taskId && commit.projectId) {
      this.router.navigate(['/projects', commit.projectId, 'tasks', commit.taskId, 'execution']);
    }
  }

  getRelativeTime(date: Date): string {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
