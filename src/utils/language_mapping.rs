use std::collections::HashMap;

pub fn get_language_mapping() -> HashMap<&'static str, Vec<&'static str>> {
    let mut mapping = HashMap::new();
    mapping.insert("c", vec!["c", "h"]);
    mapping.insert("cpp", vec!["cpp", "cc", "cxx", "hpp", "hxx"]);
    mapping.insert("java", vec!["java"]);
    mapping.insert("javascript", vec!["js"]);
    mapping.insert("python", vec!["py"]);
    mapping.insert("golang", vec!["go"]);
    mapping.insert("rust", vec!["rs"]);
    mapping
}

pub fn get_language_from_extension(extension: &str) -> Option<&'static str> {
    let mapping = get_language_mapping();
    for (language, extensions) in mapping.iter() {
        if extensions.contains(&extension) {
            return Some(language);
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_language_mapping() {
        let mapping = get_language_mapping();
        assert_eq!(mapping.get("c"), Some(&vec!["c", "h"]));
        assert_eq!(mapping.get("cpp"), Some(&vec!["cpp", "cc", "cxx", "hpp", "hxx"]));
        assert_eq!(mapping.get("java"), Some(&vec!["java"]));
        assert_eq!(mapping.get("javascript"), Some(&vec!["js"]));
        assert_eq!(mapping.get("python"), Some(&vec!["py"]));
        assert_eq!(mapping.get("golang"), Some(&vec!["go"]));
        assert_eq!(mapping.get("rust"), Some(&vec!["rs"]));
    }

    #[test]
    fn test_get_language_from_extension() {
        assert_eq!(get_language_from_extension("c"), Some("c"));
        assert_eq!(get_language_from_extension("h"), Some("c"));
        assert_eq!(get_language_from_extension("cpp"), Some("cpp"));
        assert_eq!(get_language_from_extension("cc"), Some("cpp"));
        assert_eq!(get_language_from_extension("cxx"), Some("cpp"));
        assert_eq!(get_language_from_extension("hpp"), Some("cpp"));
        assert_eq!(get_language_from_extension("hxx"), Some("cpp"));
        assert_eq!(get_language_from_extension("java"), Some("java"));
        assert_eq!(get_language_from_extension("js"), Some("javascript"));
        assert_eq!(get_language_from_extension("py"), Some("python"));
        assert_eq!(get_language_from_extension("go"), Some("golang"));
        assert_eq!(get_language_from_extension("rs"), Some("rust"));
        assert_eq!(get_language_from_extension("unknown"), None);
    }
}