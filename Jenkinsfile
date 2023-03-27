#!groovy
@Library('waluigi@release/7') _

beehiveFlowBuild(
  container: [
    tag: '18',
    resourceRequestMemory: '3Gi',
    resourceLimitCpu: '4',
    resourceLimitMemory: '3Gi'
  ],
  test: {
    bedrockBrowsers(testDirs: [ "src/test/ts/browser" ])
  },
  customSteps: {
    stage("update storybook") {
      def status = beehiveFlowStatus()
      if (status.branchState == 'releaseReady' && status.isLatest) {
        tinyGit.withGitHubSSHCredentials {
          exec('yarn deploy-storybook')
        }
      } else {
        echo "Skipping as is not latest release"
      }
    }
  }
)
