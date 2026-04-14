pipeline {
  agent any
  environment {
    SONAR_TOKEN = credentials('sonar-token')
    IMAGE = "youruser/frontend:${env.GIT_COMMIT[0..7]}"
  }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('SonarQube') {
      steps {
        withSonarQubeEnv('SonarQube') {
          sh 'sonar-scanner -Dsonar.projectKey=frontend'
        }
      }
    }
    stage('Quality Gate') {
      steps { waitForQualityGate abortPipeline: true }
    }
    stage('Docker Build') {
      steps {
        sh "docker build -t ${IMAGE} ."
      }
    }
    stage('Docker Push') {
      steps {
        withCredentials([usernamePassword(
          credentialsId:'dockerhub-credentials',
          usernameVariable:'USER',
          passwordVariable:'PASS')]) {
          sh "echo $PASS | docker login -u $USER --password-stdin"
          sh "docker push ${IMAGE}"
        }
      }
    }
  }
}
    