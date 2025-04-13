
pipeline {
    agent any // Run on the main Jenkins node

    environment {
        JWT_SECRET = "your-dev-secret-from-jenkinsfile"
    }

    options {
        wipeWorkspace()
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                checkout scm
                echo "Code checked out."
            }
        }

        stage('Build & Reset') {
            // WARNING: This stage WIPES databases every time! Only for transient dev/test.
            steps {
                script {
                    // Use docker compose (v2 syntax)
                    def composeCmd = "docker compose -f docker-compose.yml" // Note: space, not hyphen

                    try {
                        echo "Stopping any previous containers..."
                        sh "${composeCmd} down --remove-orphans || true"

                        echo "Building images..."
                        // Use buildx which is default in v2, progress plain is good for logs
                        sh "${composeCmd} build --progress=plain api-gateway auth-service book-service"

                        echo "Starting databases..."
                        sh "${composeCmd} up -d auth-db book-db"

                        echo "Waiting for databases..."
                        sleep(20) // Basic wait

                        echo "Resetting Auth Service database..."
                        // Use 'docker compose run' which is equivalent to v1
                        sh "${composeCmd} run --rm --entrypoint '' auth-service sh -c 'npx prisma migrate reset --force'"

                        echo "Resetting Book Service database..."
                        sh "${composeCmd} run --rm --entrypoint '' book-service sh -c 'npx prisma migrate reset --force'"

                        echo "Database resets complete."

                    } catch (e) {
                        error "Build & Reset stage failed: ${e.getMessage()}"
                    } finally {
                        echo "Stopping databases..."
                        sh "${composeCmd} down --remove-orphans || true"
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline finished. Final cleanup..."
            sh "docker compose -f docker-compose.yml down --remove-orphans || true"
        }
    }
}