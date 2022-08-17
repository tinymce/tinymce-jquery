#!groovy
@Library('waluigi@v6.0.0') _

beehiveFlowBuild(
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
