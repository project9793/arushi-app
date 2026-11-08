pluginManagement {
    repositories {
        // Maven Central is redirecting the Kotlin compiler jar to GitHub
        // releases, which keeps answering 504. These mirrors serve it directly.
        maven("https://maven.aliyun.com/repository/google")
        maven("https://maven.aliyun.com/repository/public")
        maven("https://repo.huaweicloud.com/repository/maven")
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        maven("https://maven.aliyun.com/repository/google")
        maven("https://maven.aliyun.com/repository/public")
        maven("https://repo.huaweicloud.com/repository/maven")
        google()
        mavenCentral()
    }
}

rootProject.name = "ArushiNative"
include(":app")
